"use client";

import { useEffect, useState } from "react";

export default function DiagnosticsPage() {
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    async function test() {
      try {
        // Fetch the data URL for the target file
        const res = await fetch("/api/test-media", {
          method: "POST",
          body: JSON.stringify({
            filePath: "media/d20a29a3-e621-4512-b2f7-f00d22878bc6.png"
          })
        });
        const data = await res.json();
        
        if (!data.success) {
          setResult(`❌ Server error: ${data.error}`);
          return;
        }

        const urlLength = data.dataUrlLength;
        const prefix = data.dataUrlPrefix;
        
        // Now test blob conversion
        const fullDataUrl = `${prefix}...`; // We'll fetch the actual one
        const res2 = await fetch("/api/test-media", {
          method: "POST",
          body: JSON.stringify({})
        });
        const bulkData = await res2.json();
        
        if (!bulkData.targetFileData) {
          setResult("❌ File not in bulk fetch results");
          return;
        }

        const actualDataUrl = bulkData.targetFileData.prefix.substring(0, 200);
        setResult(`✅ Server returned data URL correctly\n` +
          `Data URL size: ${bulkData.targetFileData.urlLength} bytes\n\n` +
          `Testing Blob conversion...\n`);

        // Now try to convert (this matches the actual implementation)
        try {
          const [header, base64] = actualDataUrl.split(",");
          if (!base64) {
            setResult(prev => prev + "❌ Could not split data URL at comma\n");
            return;
          }
          
          const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          setResult(prev => prev + 
            `✅ Successfully created Blob\n` +
            `MIME type: ${mimeType}\n` +
            `Blob size: ${blob.size} bytes\n` +
            `Blob URL generated: ${blobUrl.substring(0, 50)}...\n\n` +
            `Testing image load with Blob URL...`);

          // Test image loading
          const img = new Image();
          let loaded = false;
          let timeout = setTimeout(() => {
            if (!loaded) {
              setResult(prev => prev + "\n❌ Image load timed out after 5s\n");
            }
          }, 5000);

          img.onload = () => {
            loaded = true;
            clearTimeout(timeout);
            setResult(prev => prev + `\n✅ Image loaded successfully!\n` +
              `Image dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            URL.revokeObjectURL(blobUrl);
          };

          img.onerror = () => {
            loaded = true;
            clearTimeout(timeout);
            setResult(prev => prev + `\n❌ Image failed to load`);
            URL.revokeObjectURL(blobUrl);
          };

          img.src = blobUrl;
        } catch (e) {
          setResult(prev => prev + `\n❌ Conversion error: ${e instanceof Error ? e.message : String(e)}`);
        }
      } catch (error) {
        setResult(`❌ Fetch error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    test();
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Media Display Diagnostics</h1>
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap font-mono text-sm">
        {result || "Testing..."}
      </pre>
    </div>
  );
}
