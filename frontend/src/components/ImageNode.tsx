import { type JSX } from "react";
import {
	DecoratorNode,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
} from "lexical";
import ResizableImage from "./ResizableImage";

export type SerializedImageNode = {
	type: "image";
	version: 1;
	src: string;
	altText?: string;
	width?: number;
} & SerializedLexicalNode;

export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;
	__width?: number;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__altText, node.__width, node.__key);
	}

	constructor(src: string, altText = "", width?: number, key?: NodeKey) {
		super(key);

		this.__src = src;
		this.__altText = altText;
		this.__width = width;
	}

	getSrc() { return this.__src; }

	getAltText() { return this.__altText; }

	getWidth() { return this.__width; }

	setWidth(width?: number) {
		const writable = this.getWritable();
		writable.__width = width;
	}

	createDOM(): HTMLElement {
		return document.createElement("span");
	}

	updateDOM(): false { return false; }

	static importJSON(serialized: SerializedImageNode): ImageNode {
		return new ImageNode(serialized.src, serialized.altText ?? "", serialized.width);
	}

	exportJSON(): SerializedImageNode {
		return {
			type: "image",
			version: 1,
			src: this.__src,
			altText: this.__altText,
			width: this.__width,
		};
	}

	decorate(): JSX.Element {
		return (
			<ResizableImage
				src={this.__src}
				alt={this.__altText}
				width={this.__width}
				nodeKey={this.getKey()}
			/>
		);
	}
}

export function $createImageNode(src: string, altText = "", width?: number) {
	return new ImageNode(src, altText, width);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}
