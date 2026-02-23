import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IssueCard } from './issue-card'
import { LanguageProvider } from '@/lib/language-context'

const mockIssue = {
    id: '1',
    title: 'reportIssue',
    description: 'Test description',
    category: 'potholes' as const,
    status: 'open' as const,
    location: 'Colombo 7',
    upvotes: 5,
    comments: 2,
    createdAt: new Date().toISOString(),
    coordinates: { lat: 6.9271, lng: 79.8612 },
}

describe('IssueCard', () => {
    it('formats camelCase titles correctly', () => {
        render(
            <LanguageProvider>
                <IssueCard issue={mockIssue} onClick={() => { }} />
            </LanguageProvider>
        )

        // "reportIssue" should be converted to "Report Issue" by capitalize + regex
        expect(screen.getByText(/Report Issue/i)).toBeInTheDocument()
    })

    it('renders correctly', () => {
        render(
            <LanguageProvider>
                <IssueCard issue={mockIssue} onClick={() => { }} />
            </LanguageProvider>
        )

        expect(screen.getByText('Colombo 7')).toBeInTheDocument()
        expect(screen.getByText('Open')).toBeInTheDocument()
    })
})
