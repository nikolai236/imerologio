import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $insertNodes } from "lexical";
import { $createImageNode } from "./ImageNode";
import useApi from "../hooks/useApi";

type Props = {
	uploadUrl?: string; // default: /uploads/image
	maxFiles?: number;
	maxBytes?: number; // per file
};

export default function ImageDropPasteUploadPlugin({
	uploadUrl = "/uploads/image",
	maxFiles = 5,
	maxBytes = 8 * 1024 * 1024,
}: Props) {
	const  api = useApi();
	const [editor] = useLexicalComposerContext();
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		const root = editor.getRootElement();
		if (!root) return;

		const handleFiles = async (files: File[]) => {
			const images = files.filter((f) => f.type.startsWith("image/")).slice(0, maxFiles);
			if (images.length === 0) return;

			setIsUploading(true);
			try {
				const urls = await Promise.all(images
					.filter(i => i.size <= maxBytes)
					.map(i =>
						api.postFile(uploadUrl, i)
							.then(({ url }) => url )
					)
				);

				if (urls.length > 0) {
					editor.update(() => {
						$insertNodes(urls.map(url =>
							$createImageNode({ src: url })
						));

						const p = $createParagraphNode();
						$insertNodes([p]);
						p.selectEnd();
					});
				}
			} finally {
				setIsUploading(false);
			}
		};

		const onDragOver = (e: DragEvent) => {
			e.preventDefault();
		};

		const onDrop = async (e: DragEvent) => {
			const dt = e.dataTransfer;
			if (!dt) return;

			const files = Array.from(dt.files ?? []);
			if (!files.length) return;

			if (files.some((f) => f.type.startsWith("image/"))) {
				e.preventDefault();
				await handleFiles(files);
			}
		};

		const onPaste = async (e: ClipboardEvent) => {
			const dt = e.clipboardData;
			if (!dt) return;

			const files = Array.from(dt.files ?? []);
			if (!files.length) return;

			if (files.some((f) => f.type.startsWith("image/"))) {
				e.preventDefault();
				await handleFiles(files);
			}
		};

		root.addEventListener("dragover", onDragOver);
		root.addEventListener("drop", onDrop);
		root.addEventListener("paste", onPaste);

		return () => {
			root.removeEventListener("dragover", onDragOver);
			root.removeEventListener("drop", onDrop);
			root.removeEventListener("paste", onPaste);
		};
	}, [editor, uploadUrl, maxFiles, maxBytes]);

	// Optional: show uploading state (you can replace with Chakra toast)
	useEffect(() => {
		const root = editor.getRootElement();
		if (!root) return;
		root.dataset.uploading = isUploading ? "1" : "0";
	}, [editor, isUploading]);

	return null;
}
