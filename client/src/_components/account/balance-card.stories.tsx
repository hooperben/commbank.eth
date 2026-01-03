import type { Meta, StoryObj } from "@storybook/react-vite";

import { BalanceCard } from "./balance-card";

const meta = {
  component: BalanceCard,
} satisfies Meta<typeof BalanceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
