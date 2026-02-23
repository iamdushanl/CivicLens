import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomNav } from './bottom-nav'
import { LanguageProvider } from '@/lib/language-context'

describe('BottomNav', () => {
    it('renders all nav items', () => {
        render(
            <LanguageProvider>
                <BottomNav activeTab="home" onTabChange={() => { }} />
            </LanguageProvider>
        )

        expect(screen.getByText('Issues')).toBeInTheDocument()
        expect(screen.getByText('Map')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('calls onTabChange when a tab is clicked', () => {
        const onTabChange = vi.fn()
        render(
            <LanguageProvider>
                <BottomNav activeTab="home" onTabChange={onTabChange} />
            </LanguageProvider>
        )

        fireEvent.click(screen.getByText('Map'))
        expect(onTabChange).toHaveBeenCalledWith('map')
    })
})
