/**
 * TransferList Component Adapter
 * 
 * Unified TransferList component (dual listbox) that allows users to move
 * items between two lists. Composes Label, AssistiveElement, TextField,
 * Checkbox, and Button components internally.
 */

import { Suspense, useState, useMemo, useCallback } from 'react'
import { useComponent } from '../hooks/useComponent'
import { buildComponentCssVarPath } from '../utils/cssVarNames'
import { Label } from './Label'
import { AssistiveElement } from './AssistiveElement'
import { TextField } from './TextField'
import { CheckboxItem } from './CheckboxItem'
import { CheckboxGroup } from './CheckboxGroup'
import { Badge } from './Badge'
import { Button } from './Button'
import { iconNameToReactComponent } from '../../modules/components/iconUtils'
import type { ComponentLayer, LibrarySpecificProps } from '../registry/types'

export type TransferListItem = {
    value: string
    label: string
    group?: string
}

export type TransferListData = [TransferListItem[], TransferListItem[]]

export type TransferListProps = {
    /** Controlled data: [sourceItems, targetItems] */
    data?: TransferListData
    /** Uncontrolled initial data: [sourceItems, targetItems] */
    defaultData?: TransferListData
    /** Called when items are transferred */
    onChange?: (data: TransferListData) => void
    /** Overall label for the component */
    label?: string
    /** Label for the source (left) list */
    sourceLabel?: string
    /** Label for the target (right) list */
    targetLabel?: string
    /** Help text displayed below the component */
    helpText?: string
    /** Error text displayed below the component */
    errorText?: string
    /** Component state */
    state?: 'default' | 'error' | 'disabled'
    /** Layer for theming */
    layer?: ComponentLayer
    /** Enable search fields (default: true) */
    searchable?: boolean
    /** Placeholder text for search fields */
    searchPlaceholder?: string
    /** Label variant for the overall label */
    required?: boolean
    /** Optional indicator */
    optional?: boolean
    /** Layout for the label */
    layout?: 'stacked' | 'side-by-side'
    /** Additional className */
    className?: string
    /** Additional styles */
    style?: React.CSSProperties
} & LibrarySpecificProps

export function TransferList({
    data: controlledData,
    defaultData,
    onChange,
    label,
    sourceLabel = 'Available',
    targetLabel = 'Selected',
    helpText,
    errorText,
    state = 'default',
    layer = 'layer-0',
    searchable = true,
    searchPlaceholder = 'Filter items...',
    required = false,
    optional = false,
    layout = 'stacked',
    className,
    style,
    mantine,
    material,
    carbon,
}: TransferListProps) {
    const Component = useComponent('TransferList')

    // Manage internal state for uncontrolled mode
    const [internalData, setInternalData] = useState<TransferListData>(
        () => defaultData || controlledData || [[], []]
    )

    // Determine effective data
    const effectiveData = controlledData !== undefined ? controlledData : internalData

    // Update handler
    const handleChange = useCallback((newData: TransferListData) => {
        if (controlledData === undefined) {
            setInternalData(newData)
        }
        onChange?.(newData)
    }, [controlledData, onChange])

    // Search state
    const [sourceSearch, setSourceSearch] = useState('')
    const [targetSearch, setTargetSearch] = useState('')

    // Selection state
    const [sourceSelected, setSourceSelected] = useState<Set<string>>(new Set())
    const [targetSelected, setTargetSelected] = useState<Set<string>>(new Set())

    // Filter items by search
    const filteredSource = useMemo(() => {
        if (!sourceSearch) return effectiveData[0]
        const query = sourceSearch.toLowerCase()
        return effectiveData[0].filter(item =>
            item.label.toLowerCase().includes(query)
        )
    }, [effectiveData, sourceSearch])

    const filteredTarget = useMemo(() => {
        if (!targetSearch) return effectiveData[1]
        const query = targetSearch.toLowerCase()
        return effectiveData[1].filter(item =>
            item.label.toLowerCase().includes(query)
        )
    }, [effectiveData, targetSearch])

    // Group items by group property
    const groupItems = useCallback((items: TransferListItem[]) => {
        const groups: Record<string, TransferListItem[]> = {}
        const ungrouped: TransferListItem[] = []

        items.forEach(item => {
            if (item.group) {
                if (!groups[item.group]) groups[item.group] = []
                groups[item.group].push(item)
            } else {
                ungrouped.push(item)
            }
        })

        return { groups, ungrouped }
    }, [])

    // Transfer handlers  
    const transferToTarget = useCallback(() => {
        if (sourceSelected.size === 0) return
        const newSource = effectiveData[0].filter(item => !sourceSelected.has(item.value))
        const itemsToMove = effectiveData[0].filter(item => sourceSelected.has(item.value))
        const newTarget = [...effectiveData[1], ...itemsToMove]
        setSourceSelected(new Set())
        handleChange([newSource, newTarget])
    }, [effectiveData, sourceSelected, handleChange])

    const transferToSource = useCallback(() => {
        if (targetSelected.size === 0) return
        const newTarget = effectiveData[1].filter(item => !targetSelected.has(item.value))
        const itemsToMove = effectiveData[1].filter(item => targetSelected.has(item.value))
        const newSource = [...effectiveData[0], ...itemsToMove]
        setTargetSelected(new Set())
        handleChange([newSource, newTarget])
    }, [effectiveData, targetSelected, handleChange])

    const transferAllToTarget = useCallback(() => {
        const newTarget = [...effectiveData[1], ...effectiveData[0]]
        setSourceSelected(new Set())
        handleChange([[], newTarget])
    }, [effectiveData, handleChange])

    const transferAllToSource = useCallback(() => {
        const newSource = [...effectiveData[0], ...effectiveData[1]]
        setTargetSelected(new Set())
        handleChange([newSource, []])
    }, [effectiveData, handleChange])

    // Toggle selection
    const toggleSourceItem = useCallback((value: string) => {
        setSourceSelected(prev => {
            const next = new Set(prev)
            if (next.has(value)) next.delete(value)
            else next.add(value)
            return next
        })
    }, [])

    const toggleTargetItem = useCallback((value: string) => {
        setTargetSelected(prev => {
            const next = new Set(prev)
            if (next.has(value)) next.delete(value)
            else next.add(value)
            return next
        })
    }, [])

    // Get icon components
    const HelpIcon = useMemo(() => iconNameToReactComponent('info'), [])
    const ErrorIcon = useMemo(() => iconNameToReactComponent('warning'), [])
    const ChevronRightIcon = useMemo(() => iconNameToReactComponent('chevron-right'), [])
    const ChevronLeftIcon = useMemo(() => iconNameToReactComponent('chevron-left'), [])
    const ChevronsRightIcon = useMemo(() => iconNameToReactComponent('chevron-double-right'), [])
    const ChevronsLeftIcon = useMemo(() => iconNameToReactComponent('chevron-double-left'), [])

    const isDisabled = state === 'disabled'


    // Render AssistiveElement for help or error
    const assistiveElement = errorText ? (
        <AssistiveElement
            text={errorText}
            variant="error"
            layer={layer}
            icon={ErrorIcon ? <ErrorIcon /> : <span>⚠</span>}
        />
    ) : helpText ? (
        <AssistiveElement
            text={helpText}
            variant="help"
            layer={layer}
            icon={HelpIcon ? <HelpIcon /> : <span>ℹ</span>}
        />
    ) : null

    // Render the overall label
    const labelElement = label ? (
        <Label
            variant={required ? 'required' : (optional ? 'optional' : 'default')}
            layout={layout}
            align="left"
            layer={layer}
        >
            {label}
        </Label>
    ) : null

    // Top-bottom margin from layout variant (like Textarea)
    const topBottomMarginVar = buildComponentCssVarPath('TransferList', 'variants', 'layouts', layout, 'properties', 'top-bottom-margin')
    const marginStyle = {
        marginTop: `var(${topBottomMarginVar})`,
        marginBottom: `var(${topBottomMarginVar})`,
    }

    // If a library component is available, use it
    if (Component) {
        const componentBody = (
            <>
                <Suspense fallback={<span />}>
                    <Component
                        data={effectiveData}
                        onChange={handleChange}
                        sourceLabel={sourceLabel}
                        targetLabel={targetLabel}
                        state={state}
                        layer={layer}
                        searchable={searchable}
                        searchPlaceholder={searchPlaceholder}
                        sourceSearch={sourceSearch}
                        targetSearch={targetSearch}
                        onSourceSearchChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceSearch(e.target.value)}
                        onTargetSearchChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetSearch(e.target.value)}
                        sourceSelected={sourceSelected}
                        targetSelected={targetSelected}
                        onToggleSourceItem={toggleSourceItem}
                        onToggleTargetItem={toggleTargetItem}
                        onTransferToTarget={transferToTarget}
                        onTransferToSource={transferToSource}
                        onTransferAllToTarget={transferAllToTarget}
                        onTransferAllToSource={transferAllToSource}
                        filteredSource={filteredSource}
                        filteredTarget={filteredTarget}
                        mantine={mantine}
                        material={material}
                        carbon={carbon}
                    />
                </Suspense>
                {assistiveElement}
            </>
        )

        if (layout === 'side-by-side' && labelElement) {
            return (
                <div className={className} style={{ ...marginStyle, ...style }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                        <div style={{ flexShrink: 0 }}>
                            {labelElement}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {componentBody}
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className={className} style={{ ...marginStyle, ...style }}>
                {labelElement}
                {componentBody}
            </div>
        )
    }

    // Fallback rendering with composed components
    // Render a list pane with embedded transfer buttons
    const renderListPane = (
        items: TransferListItem[],
        allItems: TransferListItem[],
        selected: Set<string>,
        onToggle: (value: string) => void,
        paneLabel: string,
        search: string,
        onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        transferButtons: React.ReactNode,
        buttonsPosition: 'before' | 'after',
    ) => {
        const { groups, ungrouped } = groupItems(items)
        const groupNames = Object.keys(groups).sort()
        const countText = selected.size > 0
            ? `${selected.size} / ${allItems.length}`
            : `${allItems.length}`

        return (
            <div className="recursica-transfer-list-pane" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
            }}>
                {/* Pane header with label and badge count */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Label
                        variant="default"
                        layout="stacked"
                        align="left"
                        layer={layer}
                    >
                        {paneLabel}
                    </Label>
                    <Badge size="small" layer={layer}>
                        {countText}
                    </Badge>
                </div>

                {/* Toolbar row: search + transfer buttons */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                }}>
                    {buttonsPosition === 'before' && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {transferButtons}
                        </div>
                    )}
                    {searchable && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <TextField
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={onSearchChange}
                                state={isDisabled ? 'disabled' : 'default'}
                                layer={layer}
                                disableTopBottomMargin
                                leadingIcon={(() => {
                                    const SearchIcon = iconNameToReactComponent('search')
                                    return SearchIcon ? <SearchIcon /> : <span>🔍</span>
                                })()}
                            />
                        </div>
                    )}
                    {buttonsPosition === 'after' && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {transferButtons}
                        </div>
                    )}
                </div>

                {/* Item list */}
                <div className="recursica-transfer-list-items" style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 120,
                }}>
                    {items.length === 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            opacity: 0.5,
                            fontSize: 14,
                            padding: 16,
                        }}>
                            No items
                        </div>
                    )}

                    {/* Ungrouped items */}
                    {ungrouped.map(item => (
                        <CheckboxItem
                            key={item.value}
                            checked={selected.has(item.value)}
                            onChange={() => onToggle(item.value)}
                            disabled={isDisabled}
                            label={item.label}
                            layer={layer}
                            style={{ padding: '4px 8px' }}
                        />
                    ))}

                    {/* Grouped items using CheckboxGroup */}
                    {groupNames.map(groupName => (
                        <div key={groupName} style={{ marginTop: 4 }}>
                            <CheckboxGroup
                                label={groupName}
                                layout="stacked"
                                orientation="vertical"
                                layer={layer}
                                labelSize="small"
                            >
                                {groups[groupName].map(item => (
                                    <CheckboxItem
                                        key={item.value}
                                        checked={selected.has(item.value)}
                                        onChange={() => onToggle(item.value)}
                                        disabled={isDisabled}
                                        label={item.label}
                                        layer={layer}
                                        style={{ padding: '4px 8px' }}
                                    />
                                ))}
                            </CheckboxGroup>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Source pane transfer buttons: [>] [>>]
    const sourceButtons = (
        <>
            <Button
                variant="outline"
                size="small"
                onClick={transferToTarget}
                disabled={isDisabled || sourceSelected.size === 0}
                icon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
                title="Move selected to target"
            />
            <Button
                variant="outline"
                size="small"
                onClick={transferAllToTarget}
                disabled={isDisabled || effectiveData[0].length === 0}
                icon={ChevronsRightIcon ? <ChevronsRightIcon /> : undefined}
                title="Move all to target"
            />
        </>
    )

    // Target pane transfer buttons: [<<] [<]
    const targetButtons = (
        <>
            <Button
                variant="outline"
                size="small"
                onClick={transferAllToSource}
                disabled={isDisabled || effectiveData[1].length === 0}
                icon={ChevronsLeftIcon ? <ChevronsLeftIcon /> : undefined}
                title="Move all to source"
            />
            <Button
                variant="outline"
                size="small"
                onClick={transferToSource}
                disabled={isDisabled || targetSelected.size === 0}
                icon={ChevronLeftIcon ? <ChevronLeftIcon /> : undefined}
                title="Move selected to source"
            />
        </>
    )

    return (
        <div className={`recursica-transfer-list ${className || ''}`} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            ...style,
        }}>
            {labelElement}

            <div style={{
                display: 'flex',
                gap: 12,
                alignItems: 'stretch',
            }}>
                {/* Source list: [Search] [>] [>>] */}
                {renderListPane(
                    filteredSource,
                    effectiveData[0],
                    sourceSelected,
                    toggleSourceItem,
                    sourceLabel,
                    sourceSearch,
                    (e) => setSourceSearch(e.target.value),
                    sourceButtons,
                    'after',
                )}

                {/* Target list: [<<] [<] [Search] */}
                {renderListPane(
                    filteredTarget,
                    effectiveData[1],
                    targetSelected,
                    toggleTargetItem,
                    targetLabel,
                    targetSearch,
                    (e) => setTargetSearch(e.target.value),
                    targetButtons,
                    'before',
                )}
            </div>

            {assistiveElement}
        </div>
    )
}
