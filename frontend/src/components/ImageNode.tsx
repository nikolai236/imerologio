import React from "react";
import {
	DecoratorNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	$applyNodeReplacement,
	$getSelection,
	$isRangeSelection,
} from "lexical";
import { $getRoot, $createParagraphNode } from "lexical";
import ResizableImage from "./ResizableImage";

export type ImagePayload = {
	src: string;
	alt?: string;
	width?: number;
	height?: number;
};

function convertImgElement(domNode: Node): DOMConversionOutput | null {
	const img = domNode as HTMLImageElement;
	const src = img.getAttribute("src");
	if (!src) return null;

	const alt = img.getAttribute("alt") ?? "";

	const widthAttr = img.getAttribute("width");
	const heightAttr = img.getAttribute("height");

	const width = widthAttr ? Number(widthAttr) : undefined;
	const height = heightAttr ? Number(heightAttr) : undefined;

	return { node: $createImageNode({ src, alt, width, height }) };
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
	__src: string;
	__alt: string;
	__width?: number;
	__height?: number;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key);
	}

	constructor(src: string, alt = "", width?: number, height?: number, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__alt = alt;
		this.__width = width;
		this.__height = height;
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: convertImgElement,
				priority: 2,
			}),
		};
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement("img");
		element.setAttribute("src", this.__src);
		if (this.__alt) element.setAttribute("alt", this.__alt);
		if (typeof this.__width === "number" && Number.isFinite(this.__width)) {
			element.setAttribute("width", String(this.__width));
		}
		if (typeof this.__height === "number" && Number.isFinite(this.__height)) {
			element.setAttribute("height", String(this.__height));
		}
		element.style.maxWidth = "100%";
		element.style.display = "block";
		return { element };
	}

	static importJSON(serialized: any): ImageNode {
		return $createImageNode({
			src: serialized.src,
			alt: serialized.alt,
			width: serialized.width,
			height: serialized.height,
		});
	}

	exportJSON(): any {
		return {
			type: "image",
			version: 1,
			src: this.__src,
			alt: this.__alt,
			width: this.__width,
			height: this.__height,
		};
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const span = document.createElement("span");
		span.style.display = "inline-block";
		// IMPORTANT: makes decorator behave as atomic block in the editor
		span.contentEditable = "false";
		return span;
	}

	updateDOM(_prevNode: ImageNode, _dom: HTMLElement, _config: EditorConfig): boolean {
		return false;
	}

	setWidth(width?: number) {
		const writable = this.getWritable();
		writable.__width = width;
	}

	decorate(_editor: LexicalEditor, _config: EditorConfig): React.JSX.Element {
		return (
			<ResizableImage
				src={this.__src}
				alt={this.__alt}
				width={this.__width}
				nodeKey={this.getKey()}
			/>
		);
	}

	// This combo tends to produce the most "normal" behavior:
	// selectable as a node, deletable, cursor moves around it.
	isInline(): boolean {
		return false;
	}

	isIsolated(): boolean {
		return true;
	}

	isKeyboardSelectable(): boolean {
		return true;
	}

	getSrc(): string {
		return this.__src;
	}
}

export function $createImageNode(payload: ImagePayload): ImageNode {
	return $applyNodeReplacement(new ImageNode(payload.src, payload.alt ?? "", payload.width, payload.height));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}

export function $insertImage(payload: ImagePayload) {
	const image = $createImageNode(payload);
	const selection = $getSelection();

	if ($isRangeSelection(selection)) {
		selection.insertNodes([image]);
		return;
	}

	const p = $createParagraphNode();
	p.append(image);
	$getRoot().append(p);
}
