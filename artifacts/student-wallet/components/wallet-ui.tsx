import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Transaction, Wallet } from './wallet-data';

type FeatherName = keyof typeof Feather.glyphMap;

export function PrimaryButton({
  label,
  onPress,
  testID,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
  style?: object;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        { backgroundColor: colors.primary, opacity: disabled ? 0.48 : pressed ? 0.84 : 1 },
        style,
      ]}
    >
      <Text style={[ui.buttonText, { color: colors.primaryForeground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  testID,
  label,
}: {
  name: FeatherName;
  onPress: () => void;
  testID: string;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [ui.iconButton, { opacity: pressed ? 0.65 : 1 }]}
    >
      <Feather name={name} size={21} color={colors.foreground} />
    </Pressable>
  );
}

export function PageHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={ui.header}>
      <IconButton
        name="arrow-left"
        label={`Back from ${title}`}
        testID="back-button"
        onPress={onBack}
      />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[ui.headerTitle, { color: colors.foreground }]}
      >
        {title}
      </Text>
      {right ?? <View style={ui.headerRightSpacer} />}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const colors = useColors();
  return (
    <View style={ui.fieldWrap}>
      <Text style={[ui.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        selectionColor={colors.primary}
        style={[
          ui.fieldInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[ui.sectionLabel, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

export function WalletCard({
  wallet,
  main = false,
  onPress,
  onOptions,
}: {
  wallet: Wallet;
  main?: boolean;
  onPress: () => void;
  onOptions?: () => void;
}) {
  const colors = useColors();
  if (wallet.disabled) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${wallet.name}, disabled. View history.`}
        accessibilityHint="Press and hold for wallet options."
        testID={`wallet-${wallet.id}`}
        onPress={onPress}
        onLongPress={onOptions}
        style={({ pressed }) => [
          ui.disabledWallet,
          { backgroundColor: colors.disabledSurface, opacity: pressed ? 0.76 : 1 },
        ]}
      >
        <View style={ui.disabledWalletCopy}>
          <Text style={[ui.transactionTitle, { color: colors.disabledText }]}>
            {wallet.name}
          </Text>
          <Text style={[ui.walletHint, { color: colors.disabledText }]}>
            Disabled · History retained
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.disabledText} />
      </Pressable>
    );
  }

  if (main) {
    return (
      <View
        style={[
          ui.mainWallet,
          { backgroundColor: colors.primary, borderRadius: colors.radius },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          testID="wallet-main"
          onPress={onPress}
          style={({ pressed }) => [ui.mainWalletPress, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={[ui.walletEyebrow, { color: colors.walletText }]}>
            MAIN WALLET
          </Text>
          <Text style={[ui.mainBalance, { color: colors.primaryForeground }]}>
            {`€ ${wallet.balance.toFixed(2)}`}
          </Text>
          <Text style={[ui.walletHint, { color: colors.walletText }]}>
            Available balance
          </Text>
        </Pressable>
        {onOptions ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Main wallet options"
            testID="wallet-main-options"
            onPress={onOptions}
            hitSlop={8}
            style={ui.mainWalletOptions}
          >
            <Feather name="more-horizontal" size={20} color={colors.walletText} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        ui.subWallet,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          flexBasis: '48%',
          flexGrow: 0,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        testID={`wallet-${wallet.id}`}
        onPress={onPress}
        onLongPress={onOptions}
        style={({ pressed }) => [ui.subWalletPress, { opacity: pressed ? 0.82 : 1 }]}
      >
        <View style={ui.subWalletTop}>
          <Text
            numberOfLines={1}
            style={[ui.walletEyebrow, { color: colors.mutedForeground }]}
          >
            {wallet.name.toUpperCase()}
          </Text>
        </View>
        <Text style={[ui.subBalance, { color: colors.foreground }]}>
          {`€ ${wallet.balance.toFixed(2)}`}
        </Text>
        <Text style={[ui.walletHint, { color: colors.mutedForeground }]}>
          Available balance
        </Text>
      </Pressable>
    </View>
  );
}

export function TransactionRow({
  transaction,
  walletName,
  showWallet = false,
  last = false,
}: {
  transaction: Transaction;
  walletName?: string;
  showWallet?: boolean;
  last?: boolean;
}) {
  const colors = useColors();
  const positive = transaction.amount > 0;
  return (
    <View>
      <View style={ui.transactionRow}>
        <View style={ui.transactionCopy}>
          <Text
            numberOfLines={1}
            style={[ui.transactionTitle, { color: colors.foreground }]}
          >
            {transaction.title}
          </Text>
          <Text style={[ui.transactionMeta, { color: colors.mutedForeground }]}>
            {showWallet && walletName
              ? `${walletName} · ${transaction.dateText.replace('Today · ', '').replace('Yesterday · ', '')}`
              : transaction.dateText}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[
            ui.transactionAmount,
            { color: positive ? colors.primary : colors.foreground },
          ]}
        >
          {`${positive ? '+' : '−'} € ${Math.abs(transaction.amount).toFixed(2)}`}
        </Text>
      </View>
      {!last ? (
        <View style={[ui.divider, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

const ui = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 21,
  },
  headerRightSpacer: {
    width: 40,
  },
  fieldWrap: {
    gap: 9,
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  fieldInput: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.65,
  },
  mainWallet: {
    height: 145,
    position: 'relative',
    overflow: 'hidden',
  },
  mainWalletPress: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 17,
    justifyContent: 'space-between',
  },
  mainWalletOptions: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.55,
  },
  mainBalance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38,
  },
  walletHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  subWallet: {
    height: 132,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  subWalletPress: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  subWalletTop: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subBalance: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 23,
    lineHeight: 28,
  },
  disabledWallet: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledWalletCopy: {
    gap: 5,
  },
  transactionRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  transactionCopy: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  transactionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  transactionAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
