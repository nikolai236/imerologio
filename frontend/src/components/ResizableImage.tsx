import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	type NodeKey,
} from "lexical";
import { ImageNode } from "./ImageNode";

type Props = {
	src: string;
	alt: string;
	width?: number;
	nodeKey: NodeKey;
};

export default function ResizableImage({ src, alt, width, nodeKey }: Props) {
	const [editor] = useLexicalComposerContext();

	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

	const [dragging, setDragging] = useState(false);
	const start = useRef({ x: 0, w: 0 });
	const imgRef = useRef<HTMLImageElement>(null);

	const onResizeHandleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(true);
		start.current = {
			x: e.clientX,
			w: imgRef.current?.offsetWidth ?? 300,
		};
	};

	// Click selects node (and supports shift-click multi select)
	const onClick = useCallback(
		(e: MouseEvent) => {
			// if user is dragging resize handle, don't treat it as selection click
			if (dragging) return false;

			if (e.target instanceof HTMLElement) {
				// only handle clicks inside this node's DOM
				// (Lexical calls CLICK_COMMAND globally)
				const root = e.target.closest?.(`[data-lexical-image-key="${String(nodeKey)}"]`);
				if (!root) return false;
			}

			if (e.shiftKey) {
				setSelected(!isSelected);
			} else {
				clearSelection();
				setSelected(true);
			}

			return true;
		},
		[clearSelection, dragging, isSelected, nodeKey, setSelected]
	);

	// Delete/backspace removes node when selected
	const onDelete = useCallback(() => {
		const selection = $getSelection();
		if (!$isNodeSelection(selection)) return false;

		if (!isSelected) return false;

		const node = $getNodeByKey(nodeKey);
		if (node instanceof ImageNode) {
			node.remove();
			return true;
		}
		return false;
	}, [isSelected, nodeKey]);

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_DELETE_COMMAND, () => {
				let handled = false;
				editor.update(() => {
					handled = onDelete();
				});
				return handled;
			}, COMMAND_PRIORITY_LOW),
			editor.registerCommand(KEY_BACKSPACE_COMMAND, () => {
				let handled = false;
				editor.update(() => {
					handled = onDelete();
				});
				return handled;
			}, COMMAND_PRIORITY_LOW)
		);
	}, [editor, onClick, onDelete]);

	// Resize: update node width
	useEffect(() => {
		if (!dragging) return;

		const onMove = (e: MouseEvent) => {
			const dx = e.clientX - start.current.x;
			const newW = Math.max(100, start.current.w + dx);

			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (node instanceof ImageNode) node.setWidth(newW);
			});
		};

		const onUp = () => setDragging(false);

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);

		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [dragging, editor, nodeKey]);

	return (
		<span
			// IMPORTANT: lets us detect click belongs to this node
			data-lexical-image-key={String(nodeKey)}
			contentEditable={false}
			style={{
				position: "relative",
				display: "inline-block",
				margin: "8px 0",
				outline: isSelected ? "2px solid #3182ce" : "none",
				borderRadius: 8,
			}}
		>
			<img
				ref={imgRef}
				src={src}
				alt={alt}
				draggable={false}
				style={{
					maxWidth: "100%",
					width: typeof width === "number" ? `${width}px` : "auto",
					height: "auto",
					borderRadius: 8,
					display: "block",
					userSelect: "none",
					pointerEvents: "auto",
				}}
			/>

			{/* show resize handle only when selected */}
			{isSelected && (
				<span
					onMouseDown={onResizeHandleMouseDown}
					title="Drag to resize"
					style={{
						position: "absolute",
						right: -6,
						bottom: -6,
						width: 12,
						height: 12,
						borderRadius: "50%",
						cursor: "nwse-resize",
						background: "#3182ce",
						boxShadow: "0 0 0 2px white",
					}}
				/>
			)}
		</span>
	);
}
