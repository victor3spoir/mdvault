# Complete Tiptap setup guide for TanStack Start

Assumption:

* TanStack Start
* React
* TypeScript
* Vite
* Tailwind (optional)

---

## 1. Install Tiptap packages

Inside your project:

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

`starter-kit` gives you:

* paragraphs
* headings
* bold
* italic
* strike
* lists
* blockquotes
* code blocks
* history undo/redo
* links basics

---

# 2. Create the editor component

Create:

```
src/components/editor/RichTextEditor.tsx
```

Add:

```tsx
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

export default function RichTextEditor() {

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],

    content: `
      <h1>Hello world</h1>
      <p>Start writing...</p>
    `,

    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[300px]",
      },
    },
  })


  if (!editor) {
    return null
  }


  return (
    <div className="border rounded-lg p-4">

      <div className="mb-3 flex gap-2">

        <button
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
        >
          Bold
        </button>


        <button
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
        >
          Italic
        </button>


        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({
              level: 2
            }).run()
          }
        >
          H2
        </button>

      </div>


      <EditorContent editor={editor}/>

    </div>
  )
}
```

---

# 3. Use it in a TanStack Start route

Example:

```
src/routes/editor.tsx
```

```tsx
import RichTextEditor from "~/components/editor/RichTextEditor"


export default function EditorPage(){

  return (
    <main className="p-10">

      <h1 className="text-3xl mb-5">
        Article Editor
      </h1>


      <RichTextEditor />

    </main>
  )
}
```

Now:

```
http://localhost:3000/editor
```

will show your editor.

---

# 4. Add better toolbar

Install icons:

```bash
npm install lucide-react
```

Example:

```tsx
import {
  Bold,
  Italic
} from "lucide-react"
```

Toolbar:

```tsx
<button
 onClick={() =>
  editor.chain()
   .focus()
   .toggleBold()
   .run()
 }
>
 <Bold size={18}/>
</button>
```

---

# 5. Add links

Install:

```bash
npm install @tiptap/extension-link
```

Update:

```tsx
import Link from "@tiptap/extension-link"


extensions:[
 StarterKit,

 Link.configure({
   openOnClick:false,
 })
]
```

Add button:

```tsx
editor
.chain()
.focus()
.setLink({
 href:"https://example.com"
})
.run()
```

---

# 6. Add images

Install:

```bash
npm install @tiptap/extension-image
```

Add:

```tsx
import Image from "@tiptap/extension-image"


extensions:[
 StarterKit,
 Image
]
```

Insert:

```tsx
editor
.chain()
.focus()
.setImage({
 src:"https://picsum.photos/500"
})
.run()
```

For production you normally replace this with:

```
User selects image
        |
        |
Upload to S3/R2/Cloudinary
        |
        |
Return URL
        |
        |
setImage(url)
```

---

# 7. Get editor content

Tiptap supports multiple formats.

## HTML

```tsx
const html = editor.getHTML()
```

Example:

```html
<h1>Hello</h1>
<p>Article text</p>
```

---

## JSON

Better for storing:

```tsx
const json = editor.getJSON()
```

Example:

```json
{
 "type":"doc",
 "content":[
   {
    "type":"paragraph",
    "content":[
      {
       "type":"text",
       "text":"Hello"
      }
    ]
   }
 ]
}
```

---

## Plain text

```tsx
editor.getText()
```

---

# 8. Add Markdown support

Tiptap is not Markdown-native.

Install:

```bash
npm install @tiptap/markdown
```

Then:

```tsx
import { Markdown } from "@tiptap/markdown"
```

Configure:

```tsx
extensions:[
 StarterKit,
 Markdown
]
```

Export:

```tsx
editor.getMarkdown()
```

---

# 9. Add placeholders

Install:

```bash
npm install @tiptap/extension-placeholder
```

Add:

```tsx
import Placeholder from "@tiptap/extension-placeholder"


extensions:[
 StarterKit,

 Placeholder.configure({
   placeholder:
    "Write your article..."
 })
]
```

---

# 10. Add tables

Install:

```bash
npm install \
@tiptap/extension-table \
@tiptap/extension-table-row \
@tiptap/extension-table-cell \
@tiptap/extension-table-header
```

Extensions:

```tsx
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"


extensions:[
 StarterKit,

 Table.configure({
   resizable:true
 }),

 TableRow,
 TableHeader,
 TableCell
]
```

---

# 11. Add code blocks

Already included:

```tsx
StarterKit
```

Example:

```tsx
editor
.chain()
.focus()
.toggleCodeBlock()
.run()
```

---

# 12. Add Tailwind typography

Install:

```bash
npm install @tailwindcss/typography
```

Tailwind config:

```ts
plugins:[
 require("@tailwindcss/typography")
]
```

Then:

```tsx
className="
 prose
 prose-lg
 max-w-none
"
```

---

# Recommended production structure

```
src/
 ├── components/
 │    └── editor/
 │          ├── RichTextEditor.tsx
 │          ├── Toolbar.tsx
 │          └── extensions.ts
 │
 ├── routes/
 │    └── editor.tsx
 │
 └── server/
      └── documents.ts
```

---

# For an email/article SaaS I would install

```bash
npm install \
@tiptap/react \
@tiptap/pm \
@tiptap/starter-kit \
@tiptap/extension-link \
@tiptap/extension-image \
@tiptap/extension-placeholder \
@tiptap/extension-table \
@tiptap/extension-table-row \
@tiptap/extension-table-cell \
@tiptap/extension-table-header \
lucide-react
```
