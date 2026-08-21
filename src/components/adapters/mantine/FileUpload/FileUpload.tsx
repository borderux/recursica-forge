/**
 * Mantine FileUpload Adapter
 *
 * Forge's FileUpload models the current file list as pure metadata
 * (`FileUploadItem = {id, name, size?, type?, status?}` — no `.file: File` at all), reported
 * outward via `onUpload(files: File[])` / `onRemove(fileId: string)`. The real adapter's
 * FileUpload is the mirror image: its `files` prop is a controlled list of
 * `RecursicaFileUploadItem` (`{file: File, id?}`), and there is genuinely no way to turn
 * Forge's metadata back into a real, byte-holding browser `File` object — a `File` isn't
 * serializable data, it's a real object the browser handed us once, at pick/drop time.
 *
 * So this wrapper keeps its own cache of every real `File` it has actually seen (via the
 * real component's `onFilesAdded`), keyed by file name — the one field guaranteed to appear
 * in both Forge's metadata item and the real File object — and uses that cache, not Forge's
 * `files` prop, to supply the real `File` objects. Forge's `files` prop still governs WHICH
 * ids are currently shown (so an externally-driven removal is honoured), but an id introduced
 * from outside that this wrapper never saw a real File for cannot be rendered by the real
 * dropzone — there is no way to fabricate the bytes of a file nobody ever picked. That's a
 * genuine, permanent boundary of the metadata-only Forge shape, not a bug here.
 *
 * `onUpload`/`onRemove` themselves need no reshaping at all: Forge's `onUpload(files: File[])`
 * and `onRemove(fileId: string)` already have the exact same signatures as the real
 * `onFilesAdded(files: File[])`/`onFileRemove(id: string)` — confirmed against
 * RecursicaFileUploadProps in node_modules/@recursica/mantine-adapter/dist/index.d.ts. They
 * are still listed in `Ignore` below because they are renamed (different prop names), not
 * because their value shape changed.
 *
 * `state` — the real component does have a real `disabled?: boolean` (confirmed on
 * RecursicaFileUploadProps), so `state === 'disabled'` is wired to it for real, the same way
 * Dropdown does it. Shared field vocabulary (`helpText`, etc.) is translated the same way as
 * every other field component, just inline here rather than through the central
 * FIELD_CONTRACT table — this component now has its own wrapper translation, so (per that
 * table's own rule) it's been removed from FIELD_COMPONENTS there.
 */

import { useRef } from 'react'
import { FileUpload as MantineFileUpload, type RecursicaFileUploadItem } from '@recursica/mantine-adapter'
import type { FileUploadAdapterProps } from '../../common/FileUpload'
import type { AssertWired } from '../../common/wiringCheck'

export default function FileUpload({
    files = [],
    onUpload,
    onRemove,
    label,
    helpText,
    errorText,
    layout,
    state,
    multiple = true,
    accept,
    required,
    optional,
    labelAlign,
    labelSize,
    id,
    labelId: _labelId,
    helpId: _helpId,
    errorId: _errorId,
    mantine,
}: FileUploadAdapterProps) {
    // Every real File object this wrapper has actually seen, keyed by name — Forge's own
    // `files` prop only ever carries metadata, never the File itself, so this cache is the
    // only source of real File objects available to feed the real, file-object-shaped
    // `files` prop. See file header for the genuine limitation this implies.
    const cache = useRef(new Map<string, File>())

    const realFiles: RecursicaFileUploadItem[] = []
    for (const item of files) {
        const file = cache.current.get(item.name)
        if (file) realFiles.push({ id: item.id, file })
        // else: Forge knows about this id but this wrapper never saw a real File for it
        // (e.g. seeded from outside) — it cannot be rendered by the real dropzone.
    }

    return (
        <MantineFileUpload
            files={realFiles}
            onFilesAdded={(added) => {
                for (const file of added) cache.current.set(file.name, file)
                onUpload?.(added)
            }}
            onFileRemove={(removedId) => {
                const removed = files.find((item) => item.id === removedId)
                if (removed) cache.current.delete(removed.name)
                onRemove?.(removedId)
            }}
            label={label}
            assistiveText={helpText}
            error={errorText}
            formLayout={layout === 'side-by-side' ? 'side-by-side' : 'stacked'}
            required={required}
            labelOptionalText={optional}
            labelAlignment={labelAlign}
            labelSize={labelSize}
            id={id}
            multiple={multiple}
            accept={accept}
            disabled={state === 'disabled'}
            {...mantine}
        />
    )
}

// `files`/`onUpload`/`onRemove` are excluded: adapted above between Forge's metadata-only
// list and the real File-object-holding one — see file header for why a straight rename
// can't bridge them, even though the callback signatures themselves already match. `state`
// is excluded: translated into the literal `disabled` attribute above. `layout` is excluded:
// Forge types it as an open `string` for custom variant names, wider than the real
// `formLayout` union — the ternary above is the real translation. `labelId`/`helpId`/
// `errorId` are excluded: the real component wires its own aria relationships.
type _Wiring = AssertWired<
    FileUploadAdapterProps,
    typeof MantineFileUpload,
    | 'layer' | 'disableTopBottomMargin' | 'mantine' | 'material' | 'carbon' | 'className' | 'style'
    | 'files' | 'onUpload' | 'onRemove' | 'state' | 'layout'
    | 'labelId' | 'helpId' | 'errorId',
    { helpText: 'assistiveText'; errorText: 'error'; optional: 'labelOptionalText'; labelAlign: 'labelAlignment' }
>
const _wiringCheck: _Wiring = true
