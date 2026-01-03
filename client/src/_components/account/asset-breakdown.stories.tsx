import type { Meta, StoryObj } from '@storybook/react-vite';

import { AssetBreakdown } from './asset-breakdown';

const meta = {
  component: AssetBreakdown,
} satisfies Meta<typeof AssetBreakdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};