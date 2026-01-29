import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OwnershipToggle } from './ownership-toggle';

// Mock @dhanam/ui components as simple HTML elements
jest.mock('@dhanam/ui', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props}>{children}</h3>
  ),
  Tabs: ({
    children,
    value,
    onValueChange,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="tabs-list" role="tablist" {...props}>{children}</div>
  ),
  TabsTrigger: ({
    children,
    value,
    ...props
  }: React.HTMLAttributes<HTMLButtonElement> & { value?: string }) => (
    <button data-testid={`tab-${value}`} role="tab" data-value={value} {...props}>
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { value?: string }) => (
    <div data-testid={`tab-content-${value}`} role="tabpanel" {...props}>
      {children}
    </div>
  ),
}));

// Mock lucide-react icons as spans with data-testid
jest.mock('lucide-react', () => ({
  User: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="icon-user" {...props} />
  ),
  Users: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="icon-users" {...props} />
  ),
  Heart: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="icon-heart" {...props} />
  ),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

const defaultProps = {
  spaceId: 'space-1',
};

const netWorthData = {
  yours: 50000,
  mine: 30000,
  ours: 20000,
  total: 100000,
};

describe('OwnershipToggle', () => {
  it('renders three toggle tab options: yours, mine, ours', () => {
    render(<OwnershipToggle {...defaultProps} />);

    expect(screen.getByTestId('tab-yours')).toBeInTheDocument();
    expect(screen.getByTestId('tab-mine')).toBeInTheDocument();
    expect(screen.getByTestId('tab-ours')).toBeInTheDocument();
  });

  it('renders tab labels with correct text', () => {
    render(<OwnershipToggle {...defaultProps} />);

    expect(screen.getByTestId('tab-yours')).toHaveTextContent('Yours');
    expect(screen.getByTestId('tab-mine')).toHaveTextContent('Mine');
    expect(screen.getByTestId('tab-ours')).toHaveTextContent('Ours');
  });

  it('renders appropriate icons for each tab option', () => {
    render(<OwnershipToggle {...defaultProps} />);

    // User icons for yours and mine tabs, Heart icon for ours tab
    const userIcons = screen.getAllByTestId('icon-user');
    const heartIcons = screen.getAllByTestId('icon-heart');

    // At minimum, tabs have User icons for yours/mine and Heart for ours
    expect(userIcons.length).toBeGreaterThanOrEqual(2);
    expect(heartIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('defaults to "yours" as the active filter', () => {
    render(<OwnershipToggle {...defaultProps} />);

    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-value', 'yours');
  });

  it('calls onFilterChange when clicking a net worth card', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <OwnershipToggle
        {...defaultProps}
        netWorth={netWorthData}
        onFilterChange={onChange}
      />
    );

    const cards = screen.getAllByTestId('card');
    // Click the "mine" card (second clickable card)
    await user.click(cards[1]);

    expect(onChange).toHaveBeenCalledWith('mine');
  });

  it('calls onFilterChange with "ours" when clicking the ours card', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <OwnershipToggle
        {...defaultProps}
        netWorth={netWorthData}
        onFilterChange={onChange}
      />
    );

    const cards = screen.getAllByTestId('card');
    // Click the "ours" card (third clickable card)
    await user.click(cards[2]);

    expect(onChange).toHaveBeenCalledWith('ours');
  });

  it('shows correct active state via ring class on the active card', async () => {
    const user = userEvent.setup();

    render(
      <OwnershipToggle {...defaultProps} netWorth={netWorthData} />
    );

    const cards = screen.getAllByTestId('card');

    // Initially "yours" is active - first card should have ring class
    expect(cards[0].className).toContain('ring-2 ring-primary');
    expect(cards[1].className).not.toContain('ring-2 ring-primary');

    // Click "mine" card
    await user.click(cards[1]);

    expect(cards[0].className).not.toContain('ring-2 ring-primary');
    expect(cards[1].className).toContain('ring-2 ring-primary');
  });

  it('renders net worth amounts when netWorth prop is provided', () => {
    render(
      <OwnershipToggle {...defaultProps} netWorth={netWorthData} />
    );

    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
    expect(screen.getByText('$20,000')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('does not render net worth cards when netWorth is not provided', () => {
    render(<OwnershipToggle {...defaultProps} />);

    expect(screen.queryByText('$50,000')).not.toBeInTheDocument();
  });

  it('renders partner name in mine card description', () => {
    render(
      <OwnershipToggle
        {...defaultProps}
        netWorth={netWorthData}
        partnerName="Alex"
      />
    );

    expect(screen.getByText("Alex's accounts")).toBeInTheDocument();
  });

  it('uses default partner name "Partner" when not specified', () => {
    render(
      <OwnershipToggle {...defaultProps} netWorth={netWorthData} />
    );

    expect(screen.getByText("Partner's accounts")).toBeInTheDocument();
  });

  it('renders tab content sections for each filter', () => {
    render(<OwnershipToggle {...defaultProps} />);

    expect(screen.getByTestId('tab-content-yours')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content-mine')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content-ours')).toBeInTheDocument();
  });

  it('renders Users icon in the total net worth card', () => {
    render(
      <OwnershipToggle {...defaultProps} netWorth={netWorthData} />
    );

    expect(screen.getByTestId('icon-users')).toBeInTheDocument();
  });

  it('renders Heart icon in the ours net worth card header', () => {
    render(
      <OwnershipToggle {...defaultProps} netWorth={netWorthData} />
    );

    const heartIcons = screen.getAllByTestId('icon-heart');
    // At least one from the card, one from the tab
    expect(heartIcons.length).toBeGreaterThanOrEqual(1);
  });
});
