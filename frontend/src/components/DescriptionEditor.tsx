import React, { useEffect, useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { $getRoot } from "lexical";

import { ImageNode } from "./ImageNode";
import ImageDropPasteUploadPlugin from "./ImageDropPasteUploadPlugin";
import EditButton from "./EditButton";

type Props = {
	valueHtml: string;
	disabled?: boolean;
	placeholder?: string;
	minHeightPx?: number;
	uploadUrl?: string; // default: /uploads/image

	handleEditClick?: () => void;
	onChangeHtml: (html: string) => void;
};

const theme = {
	paragraph: "lexical-paragraph",
};

function ErrorBoundary({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

function SetEditablePlugin({ disabled }: { disabled: boolean }) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editor.setEditable(!disabled);
	}, [editor, disabled]);

	return null;
	}

function HydrateHtmlPlugin({
	valueHtml,
	onlyOnce = true,
}: {
	valueHtml: string;
	onlyOnce?: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	const hydrated = useRef(false);

	useEffect(() => {
		if (!valueHtml) return;

		if (onlyOnce && hydrated.current) return;
		hydrated.current = true;

		editor.update(() => {
			const parser = new DOMParser();
			const dom = parser.parseFromString(valueHtml, "text/html");
			const nodes = $generateNodesFromDOM(editor, dom);

			const root = $getRoot();
			root.clear();
			root.append(...nodes);
		});
	}, [editor, valueHtml, onlyOnce]);

	return null;
}

export default function LexicalDescriptionEditor({
	valueHtml,
	onChangeHtml,
	handleEditClick,
	disabled = false,
	placeholder = "Write notes… (drag & drop or paste images)",
	minHeightPx = 180,
	uploadUrl = "/uploads/image",
}: Props) {
	const initialConfig = useMemo(
		() => ({
			namespace: "trade-description",
			theme,
			editable: !disabled,
			nodes: [
				HeadingNode,
				QuoteNode,
				ListNode,
				ListItemNode,
				LinkNode,
				AutoLinkNode,
				ImageNode,
			],
			onError(error: unknown) {
				console.error(error);
			},
		}),
		[disabled]
	);

	return (
		<Box>
			<Text fontSize="sm" color="fg.muted" mb={2}>
				Description
			</Text>

			<Flex align="right" gap={2}>
				<EditButton
					visible={disabled}
					onClick={handleEditClick ?? (()=>{})}
				/>
			</Flex>
			<Box borderWidth="1px" borderRadius="md" overflow="hidden">
				<LexicalComposer initialConfig={initialConfig}>
					<SetEditablePlugin disabled={disabled} />
					<HydrateHtmlPlugin valueHtml={valueHtml} />

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

				<Text fontSize="xs" color="fg.muted" mt={2}>
					Saves HTML to your description field.
				</Text>
			</Box>
		</Box>
	);
}
