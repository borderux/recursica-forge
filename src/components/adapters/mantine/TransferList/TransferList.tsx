/**
 * Mantine TransferList Implementation
 * 
 * Built from Recursica components (TextField, CheckboxItem, CheckboxGroup, Badge, Button, Label).
 * This is a composite component — it doesn't wrap a Mantine TransferList
 * (which doesn't exist in Mantine v8), but uses Recursica's own components
 * styled with CSS variables.
 */

import { useMemo } from 'react'
import { Label } from '../../Label'
import { TextField } from '../../TextField'
import { CheckboxItem } from '../../CheckboxItem'
import { CheckboxGroup } from '../../CheckboxGroup'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import { iconNameToReactComponent } from '../../../../modules/components/iconUtils'
import type { TransferListItem, TransferListData } from '../../TransferList'
import type { ComponentLayer } from '../../../registry/types'
import './TransferList.css'

interface MantineTransferListProps {
    data: TransferListData
    onChange: (data: TransferListData) => void
    sourceLabel: string
    targetLabel: string
    state: 'default' | 'error' | 'disabled'
    layer: ComponentLayer
    searchable: boolean
    searchPlaceholder: string
    sourceSearch: string
    targetSearch: string
    onSourceSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onTargetSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    sourceSelected: Set<string>
    targetSelected: Set<string>
    onToggleSourceItem: (value: string) => void
    onToggleTargetItem: (value: string) => void
    onTransferToTarget: () => void
    onTransferToSource: () => void
    onTransferAllToTarget: () => void
    onTransferAllToSource: () => void
    filteredSource: TransferListItem[]
    filteredTarget: TransferListItem[]
    mantine?: Record<string, any>
}

// Group items by their group property
function groupItems(items: TransferListItem[]) {
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
}

// Render item list (shared between source and target)
function renderItems(
    items: TransferListItem[],
    selected: Set<string>,
    onToggle: (value: string) => void,
    isDisabled: boolean,
    layer: ComponentLayer,
    search: string,
) {
    const { groups, ungrouped } = groupItems(items)
    const groupNames = Object.keys(groups).sort()

    return (
        <div className="recursica-transfer-list-items">
            {items.length === 0 && (
                <div className="recursica-transfer-list-empty">
                    {search ? 'No matching items' : 'No items'}
                </div>
            )}

            {/* Ungrouped items */}
            {ungrouped.map(item => (
                <div
                    key={item.value}
                    className={`recursica-transfer-list-item ${selected.has(item.value) ? 'recursica-transfer-list-item--selected' : ''}`}
                >
                    <CheckboxItem
                        checked={selected.has(item.value)}
                        onChange={() => onToggle(item.value)}
                        disabled={isDisabled}
                        label={item.label}
                        layer={layer}
                    />
                </div>
            ))}

            {/* Grouped items using CheckboxGroup */}
            {groupNames.map(groupName => (
                <div key={groupName} className="recursica-transfer-list-group">
                    <CheckboxGroup
                        label={groupName}
                        layout="stacked"
                        orientation="vertical"
                        layer={layer}
                        labelSize="small"
                    >
                        {groups[groupName].map(item => (
                            <div
                                key={item.value}
                                className={`recursica-transfer-list-item ${selected.has(item.value) ? 'recursica-transfer-list-item--selected' : ''}`}
                            >
                                <CheckboxItem
                                    checked={selected.has(item.value)}
                                    onChange={() => onToggle(item.value)}
                                    disabled={isDisabled}
                                    label={item.label}
                                    layer={layer}
                                />
                            </div>
                        ))}
                    </CheckboxGroup>
                </div>
            ))}
        </div>
    )
}

export default function TransferList({
    data,
    onChange,
    sourceLabel,
    targetLabel,
    state,
    layer,
    searchable,
    searchPlaceholder,
    sourceSearch,
    targetSearch,
    onSourceSearchChange,
    onTargetSearchChange,
    sourceSelected,
    targetSelected,
    onToggleSourceItem,
    onToggleTargetItem,
    onTransferToTarget,
    onTransferToSource,
    onTransferAllToTarget,
    onTransferAllToSource,
    filteredSource,
    filteredTarget,
}: MantineTransferListProps) {
    const isDisabled = state === 'disabled'

    // Icons
    const SearchIcon = useMemo(() => iconNameToReactComponent('search'), [])
    const ChevronRightIcon = useMemo(() => iconNameToReactComponent('chevron-right'), [])
    const ChevronLeftIcon = useMemo(() => iconNameToReactComponent('chevron-left'), [])
    const ChevronsRightIcon = useMemo(() => iconNameToReactComponent('chevron-double-right'), [])
    const ChevronsLeftIcon = useMemo(() => iconNameToReactComponent('chevron-double-left'), [])

    // Count display text
    const sourceCountText = sourceSelected.size > 0
        ? `${sourceSelected.size} / ${data[0].length}`
        : `${data[0].length}`
    const targetCountText = targetSelected.size > 0
        ? `${targetSelected.size} / ${data[1].length}`
        : `${data[1].length}`

    return (
        <div className={`recursica-transfer-list ${state === 'error' ? 'recursica-transfer-list--error' : ''} ${isDisabled ? 'recursica-transfer-list--disabled' : ''}`}>
            <div className="recursica-transfer-list-body">
                {/* Source pane */}
                <div className="recursica-transfer-list-pane">
                    {/* Pane header with label and badge count */}
                    <div className="recursica-transfer-list-pane-header">
                        <Label
                            variant="default"
                            layout="stacked"
                            align="left"
                            layer={layer}
                        >
                            {sourceLabel}
                        </Label>
                        <Badge size="small" layer={layer}>
                            {sourceCountText}
                        </Badge>
                    </div>

                    {/* Search + transfer buttons row: [Search] [>] [>>] */}
                    <div className="recursica-transfer-list-toolbar">
                        {searchable && (
                            <div className="recursica-transfer-list-search">
                                <TextField
                                    placeholder={searchPlaceholder}
                                    value={sourceSearch}
                                    onChange={onSourceSearchChange}
                                    state={isDisabled ? 'disabled' : 'default'}
                                    layer={layer}
                                    disableTopBottomMargin
                                    leadingIcon={SearchIcon ? <SearchIcon /> : <span>🔍</span>}
                                />
                            </div>
                        )}
                        <div className="recursica-transfer-list-actions">
                            <Button
                                variant="outline"
                                size="small"
                                onClick={onTransferToTarget}
                                disabled={isDisabled || sourceSelected.size === 0}
                                icon={ChevronRightIcon ? <ChevronRightIcon /> : undefined}
                                title="Move selected to target"
                            />
                            <Button
                                variant="outline"
                                size="small"
                                onClick={onTransferAllToTarget}
                                disabled={isDisabled || data[0].length === 0}
                                icon={ChevronsRightIcon ? <ChevronsRightIcon /> : undefined}
                                title="Move all to target"
                            />
                        </div>
                    </div>

                    {/* Item list */}
                    {renderItems(filteredSource, sourceSelected, onToggleSourceItem, isDisabled, layer, sourceSearch)}
                </div>

                {/* Target pane */}
                <div className="recursica-transfer-list-pane">
                    {/* Pane header with label and badge count */}
                    <div className="recursica-transfer-list-pane-header">
                        <Label
                            variant="default"
                            layout="stacked"
                            align="left"
                            layer={layer}
                        >
                            {targetLabel}
                        </Label>
                        <Badge size="small" layer={layer}>
                            {targetCountText}
                        </Badge>
                    </div>

                    {/* Transfer buttons + search row: [<<] [<] [Search] */}
                    <div className="recursica-transfer-list-toolbar">
                        <div className="recursica-transfer-list-actions">
                            <Button
                                variant="outline"
                                size="small"
                                onClick={onTransferAllToSource}
                                disabled={isDisabled || data[1].length === 0}
                                icon={ChevronsLeftIcon ? <ChevronsLeftIcon /> : undefined}
                                title="Move all to source"
                            />
                            <Button
                                variant="outline"
                                size="small"
                                onClick={onTransferToSource}
                                disabled={isDisabled || targetSelected.size === 0}
                                icon={ChevronLeftIcon ? <ChevronLeftIcon /> : undefined}
                                title="Move selected to source"
                            />
                        </div>
                        {searchable && (
                            <div className="recursica-transfer-list-search">
                                <TextField
                                    placeholder={searchPlaceholder}
                                    value={targetSearch}
                                    onChange={onTargetSearchChange}
                                    state={isDisabled ? 'disabled' : 'default'}
                                    layer={layer}
                                    disableTopBottomMargin
                                    leadingIcon={SearchIcon ? <SearchIcon /> : <span>🔍</span>}
                                />
                            </div>
                        )}
                    </div>

                    {/* Item list */}
                    {renderItems(filteredTarget, targetSelected, onToggleTargetItem, isDisabled, layer, targetSearch)}
                </div>
            </div>
        </div>
    )
}
