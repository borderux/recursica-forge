import { useState } from 'react'
import { Tabs } from '../../components/adapters/Tabs'
import { Tabs as MantineTabs } from '@mantine/core'
import { Image, ChatCircle, Gear } from '@phosphor-icons/react'
import { Badge } from '../../components/adapters/Badge'

interface TabsPreviewProps {
    selectedVariants: Record<string, string>
    selectedLayer: string
    componentElevation?: string
}

export default function TabsPreview({
    selectedVariants,
    selectedLayer,
    componentElevation,
}: TabsPreviewProps) {
    const [value, setValue] = useState<string | null>('gallery')
    const variant = (selectedVariants.style || 'default') as 'default' | 'pills' | 'outline'
    const orientation = (selectedVariants.orientation || 'horizontal') as 'horizontal' | 'vertical'

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', width: '600px' }}>
            {/* Basic Tabs */}
            <div>
                <h2 style={{ marginBottom: '16px' }}>Text</h2>
                <Tabs
                    value={value ?? undefined}
                    onChange={(newValue) => setValue(newValue ?? null)}
                    variant={variant}
                    orientation={orientation}
                    layer={selectedLayer}
                >
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">Gallery</MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">Messages</MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">Settings</MantineTabs.Tab>
                    </MantineTabs.List>
                </Tabs>
            </div>

            {/* Tabs with Icons */}
            <div>
                <h2 style={{ marginBottom: '16px' }}>Text with icons</h2>
                <Tabs
                    value={value ?? undefined}
                    onChange={(newValue) => setValue(newValue ?? null)}
                    variant={variant}
                    orientation={orientation}
                    layer={selectedLayer}
                >
                    <MantineTabs.List>
                        <MantineTabs.Tab
                            value="gallery"
                            leftSection={<Image size={16} weight="regular" />}
                        >
                            Gallery
                        </MantineTabs.Tab>
                        <MantineTabs.Tab
                            value="messages"
                            leftSection={<ChatCircle size={16} weight="regular" />}
                        >
                            Messages
                        </MantineTabs.Tab>
                        <MantineTabs.Tab
                            value="settings"
                            leftSection={<Gear size={16} weight="regular" />}
                        >
                            Settings
                        </MantineTabs.Tab>
                    </MantineTabs.List>
                </Tabs>
            </div>

            {/* Tabs with Badges */}
            <div>
                <h2 style={{ marginBottom: '16px' }}>Text with badges</h2>
                <Tabs
                    value={value ?? undefined}
                    onChange={(newValue) => setValue(newValue ?? null)}
                    variant={variant}
                    orientation={orientation}
                    layer={selectedLayer}
                >
                    <MantineTabs.List>
                        <MantineTabs.Tab value="gallery">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span>Gallery</span>
                                <Badge variant="primary-color">42</Badge>
                            </div>
                        </MantineTabs.Tab>
                        <MantineTabs.Tab value="messages">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span>Messages</span>
                                <Badge variant="primary-color">7</Badge>
                            </div>
                        </MantineTabs.Tab>
                        <MantineTabs.Tab value="settings">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span>Settings</span>
                                <Badge variant="primary-color">104</Badge>
                            </div>
                        </MantineTabs.Tab>
                    </MantineTabs.List>
                </Tabs>
            </div>
        </div>
    )
}
