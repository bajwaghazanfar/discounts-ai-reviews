import { DropZone, Thumbnail, Text, BlockStack } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import { useState, useCallback } from "react";

interface Props {
  reviewId: number;
  existingImageUrl?: string;
}

export function ImageUpload({ reviewId, existingImageUrl }: Props) {
  const fetcher = useFetcher();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl || "");

  const handleDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles[0];
      if (!uploadedFile) return;

      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("reviewId", reviewId.toString());
      fetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    },
    [fetcher, reviewId],
  );

  const fileUpload = !previewUrl && (
    <DropZone.FileUpload actionTitle="Upload image" />
  );

  return (
    <DropZone onDrop={handleDrop} accept="image/*" type="image">
           {" "}
      {previewUrl ? (
        <BlockStack align="start">
                   {" "}
          <Thumbnail source={previewUrl} alt="Uploaded image" size="small" />   
               {" "}
          <Text as="span" variant="bodySm">
            Change Image
          </Text>
                 {" "}
        </BlockStack>
      ) : (
        fileUpload
      )}
         {" "}
    </DropZone>
  );
}
