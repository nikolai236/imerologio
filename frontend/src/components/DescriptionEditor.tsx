import React, { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import { $generateHtmlFromNodes } from "@lexical/html";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";

import { ImageNode } from "./ImageNode";
import ImageDropPasteUploadPlugin from "./ImageDropPasteUploadPlugin";

type Props = {
	valueHtml: string;
	onChangeHtml: (html: string) => void;
	placeholder?: string;
	minHeightPx?: number;
	uploadUrl?: string; // default: /uploads/image
};

const theme = {
	paragraph: "lexical-paragraph",
};

function ErrorBoundary({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export default function LexicalDescriptionEditor({
	valueHtml,
	onChangeHtml,
	placeholder = "Write notes… (drag & drop or paste images)",
	minHeightPx = 180,
	uploadUrl = "/uploads/image",
}: Props) {
	const initialConfig = useMemo(
		() => ({
			namespace: "trade-description",
			theme,
			nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
			onError(error: unknown) {
				// eslint-disable-next-line no-console
				console.error(error);
			},
		}),
		[]
	);

	return (
		<Box borderWidth="1px" borderRadius="md" overflow="hidden">
			<LexicalComposer initialConfig={initialConfig}>
				<Box px={3} py={2}>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className="lexical-contenteditable"
								style={{ minHeight: minHeightPx, outline: "none" }}
							/>
						}
						placeholder={
							<Text opacity={0.6} pointerEvents="none">
								{placeholder}
							</Text>
						}
						ErrorBoundary={ErrorBoundary}
					/>

					<HistoryPlugin />

					<ImageDropPasteUploadPlugin uploadUrl={uploadUrl} />

					<OnChangePlugin
						onChange={(editorState, editor) => {
							editorState.read(() => {
								const html = $generateHtmlFromNodes(editor, null);
								onChangeHtml(html);
							});
						}}
					/>
				</Box>
			</LexicalComposer>
		</Box>
	);
}
