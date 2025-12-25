import React, { useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey } from "lexical";
import { ImageNode } from "./ImageNode";

type Props = {
	src: string;
	alt: string;
	width?: number;
	nodeKey: string;
};

export default function ResizableImage({ src, alt, width, nodeKey }: Props) {
	const [editor] = useLexicalComposerContext();
	const [dragging, setDragging] = useState(false);

	const start  = useRef({ x: 0, w: 0 });
	const imgRef = useRef<HTMLImageElement>(null);

	const onMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setDragging(true);

		start.current = {
			x: e.clientX,
			w: imgRef.current?.offsetWidth ?? 300
		};
	};

	useEffect(() => {
		if (!dragging) return;

		const onMove = (e: MouseEvent) => {
			const dx = e.clientX - start.current.x;
			const newW = Math.max(100, start.current.w + dx);

			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (!(node instanceof ImageNode)) return;

				node.setWidth(newW);
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
		<span style={{ position: "relative", display: "inline-block", margin: "8px 0" }}>
			<img
				ref={imgRef}
				src={src}
				alt={alt}
				style={{
					maxWidth: "100%",
					width: width ? `${width}px` : "auto",
					height: "auto",
					borderRadius: 8,
					display: "block",
				}}
			/>

			<span
				onMouseDown={onMouseDown}
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
		</span>
	);
}
