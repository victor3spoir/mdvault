Yes. **Tiptap supports inline floating toolbars** (also called **bubble menus**) exactly like you described:

* User selects text
* A small floating toolbar appears near the selection
* Actions like **Bold, Italic, Link, Highlight, Comment, AI action, etc.** are available

This is built into Tiptap via the **BubbleMenu extension**.

---

## Install

```bash
npm install @tiptap/extension-bubble-menu
```

---

## Example: inline selection toolbar

Create:

```
components/editor/BubbleToolbar.tsx
```

```tsx
import { BubbleMenu, Editor } from "@tiptap/react"

interface Props {
  editor: Editor
}


export default function BubbleToolbar({ editor }: Props) {

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
      }}
      className="
        flex gap-1
        rounded-lg
        border
        bg-white
        shadow-lg
        p-2
      "
    >

      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBold()
            .run()
        }
        className="
          px-2 py-1
          hover:bg-gray-100
        "
      >
        Bold
      </button>


      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleItalic()
            .run()
        }
        className="
          px-2 py-1
          hover:bg-gray-100
        "
      >
        Italic
      </button>


      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleStrike()
            .run()
        }
      >
        Strike
      </button>


    </BubbleMenu>
  )
}
```

---

## Add it to your editor

```tsx
import BubbleToolbar from "./BubbleToolbar"


return (
  <div>

    <BubbleToolbar editor={editor}/>

    <EditorContent editor={editor}/>

  </div>
)
```

Now:

```
Select text

        ┌────────────────┐
        │ B  I  S  Link  │
        └────────────────┘

Lorem ipsum dolor sit amet
```

---

## Add link popup

Example:

```tsx
<button
 onClick={() => {

 const url = window.prompt(
   "URL"
 )

 editor
  .chain()
  .focus()
  .extendMarkRange("link")
  .setLink({
    href:url
  })
  .run()

 }}
>
 Link
</button>
```

---

## Add AI-style actions

You can easily add:

```
Select text

 ┌─────────────────────────┐
 │ B I Link | Improve | Fix │
 └─────────────────────────┘

"The text selected here..."
```

Example:

```tsx
<button
 onClick={() => {

 const text =
 editor
  .state
  .doc
  .textBetween(
    editor.state.selection.from,
    editor.state.selection.to
  )


 console.log(text)

 }}
>
 Improve
</button>
```

Then send that text to your AI endpoint.

---

## Also available: Floating menu

Tiptap has another one:

### BubbleMenu

Appears when selecting text:

```
Select text
     ↓

[ Bold Italic Link ]
```

Good for:

* formatting
* comments
* AI actions

### FloatingMenu

Appears when cursor is empty:

```
+
Start writing...
```

Good for:

* slash commands
* inserting blocks

---

For an email/article editor, a common setup is:

```
                 BubbleMenu
                    |
                    ↓
Select text → Bold | Italic | Link | Comment | AI


Empty line → FloatingMenu
                    |
                    ↓
          /image /table /code /quote
```

Tiptap is actually one of the better choices for this kind of editor because the ProseMirror architecture was designed around exactly these kinds of extensible editor interactions.
