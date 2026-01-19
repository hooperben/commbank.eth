import { InlineEncryptConfirmation } from "@/_components/PUM/inline-encrypt-confirmation";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { mainnetAssets } from "shared/constants/token";

const meta = {
  title: "Deposit",
  component: InlineEncryptConfirmation,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    // Use fn() for action logging - best practice for callback props
    onCancel: fn(),
    onSuccess: fn(),
  },
} satisfies Meta<typeof InlineEncryptConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with USDC (first mainnet asset)
export const Default: Story = {
  args: {
    asset: mainnetAssets[0],
  },
};

// Story with ETH
export const WithETH: Story = {
  args: {
    asset: mainnetAssets.find((a) => a.symbol === "ETH") ?? mainnetAssets[0],
  },
};
