import * as Tabs from '@radix-ui/react-tabs';
import React from 'react';
import './CustomTabs.css';

interface TabItem {
    value: string;
    label: string;
    content: React.ReactNode;
}

interface CustomTabsProps {
    value: string;
    onValueChange: (value: string) => void;
    items: TabItem[];
}

export const CustomTabs: React.FC<CustomTabsProps> = ({ value, onValueChange, items }) => {
    return (
        <Tabs.Root value={value} onValueChange={onValueChange} className="custom-tabs-root">
            <Tabs.List className="custom-tabs-list">
                {items.map((item) => (
                    <Tabs.Trigger key={item.value} value={item.value} className="custom-tab-trigger">
                        {item.label}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
            {items.map((item) => (
                <Tabs.Content key={item.value} value={item.value} className="custom-tab-content">
                    {item.content}
                </Tabs.Content>
            ))}
        </Tabs.Root>
    );
};
