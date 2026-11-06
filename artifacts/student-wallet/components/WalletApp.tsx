import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Field,
  IconButton,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  TransactionRow,
  WalletCard,
} from './wallet-ui';
import {
  formatMoney,
  initialTransactions,
  initialWallets,
  STORAGE_KEY,
  type SavedWalletState,
  type Transaction,
  type Wallet,
} from './wallet-data';

type Screen =
  | 'login'
  | 'signup'
  | 'home'
  | 'walletActivity'
  | 'disabledActivity'
  | 'allActivity'
  | 'qrPayment'
  | 'confirmPayment'
  | 'settings'
  | 'addWallet';

const PAYMENT_AMOUNT = 8.5;

export default function WalletApp() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [screen, setScreen] = useState<Screen>('login');
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [profileName, setProfileName] = useState('');
  const [offlineLimit, setOfflineLimit] = useState(25);
  const [twoFactor, setTwoFactor] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [walletNameInput, setWalletNameInput] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('main');
  const [walletOptionsId, setWalletOptionsId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [limitEditorOpen, setLimitEditorOpen] = useState(false);
  const [limitValue, setLimitValue] = useState('25');
  const [paymentPin, setPaymentPin] = useState('');
  const [qrNonce, setQrNonce] = useState('student-wallet-preview');
  const [qrRemaining, setQrRemaining] = useState(10);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId);
  const walletOptions = wallets.find((wallet) => wallet.id === walletOptionsId);
  const visibleActivity = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const rank: Record<string, number> = {
          Today: 0,
          Yesterday: 1,
          'Last month': 2,
        };
        return (rank[a.dateGroup] ?? 9) - (rank[b.dateGroup] ?? 9);
      }),
    [transactions],
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          const saved = JSON.parse(raw) as Partial<SavedWalletState>;
          if (Array.isArray(saved.wallets)) setWallets(saved.wallets);
          if (Array.isArray(saved.transactions)) setTransactions(saved.transactions);
          if (typeof saved.profileName === 'string') setProfileName(saved.profileName);
          if (typeof saved.offlineLimit === 'number') setOfflineLimit(saved.offlineLimit);
          if (typeof saved.twoFactor === 'boolean') setTwoFactor(saved.twoFactor);
          if (typeof saved.paymentNotifications === 'boolean') {
            setPaymentNotifications(saved.paymentNotifications);
          }
        }
      })
      .catch(() => {
        if (mounted) setNotice('Saved preview data could not be loaded.');
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saved: SavedWalletState = {
      wallets,
      transactions,
      profileName,
      offlineLimit,
      twoFactor,
      paymentNotifications,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {
      setNotice('Changes could not be saved on this device.');
    });
  }, [
    hydrated,
    wallets,
    transactions,
    profileName,
    offlineLimit,
    twoFactor,
    paymentNotifications,
  ]);

  useEffect(() => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (notice) {
      noticeTimer.current = setTimeout(() => setNotice(''), 2800);
    }
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [notice]);

  useEffect(() => {
    if (screen !== 'qrPayment') return;
    setQrRemaining(10);
    const timer = setInterval(
      () => setQrRemaining((remaining) => Math.max(0, remaining - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [screen, qrNonce]);

  const haptic = () => {
    void Haptics.selectionAsync();
  };

  const notify = (message: string) => {
    setNotice(message);
  };

  const backToHome = () => {
    haptic();
    setFormError('');
    setScreen('home');
  };

  const showWallet = (wallet: Wallet) => {
    haptic();
    setSelectedWalletId(wallet.id);
    setScreen(wallet.disabled ? 'disabledActivity' : 'walletActivity');
  };

  const openWalletOptions = (wallet: Wallet) => {
    haptic();
    setSelectedWalletId(wallet.id);
    setWalletOptionsId(wallet.id);
  };

  const beginPayment = () => {
    haptic();
    setPaymentPin('');
    setQrNonce(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setScreen('qrPayment');
  };

  const handleLogin = () => {
    const email = loginEmail.trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || !loginPassword) {
      setFormError('Enter a valid university email and password.');
      return;
    }
    setFormError('');
    setProfileName((current) => current || email.split('@')[0]);
    setScreen('home');
    haptic();
  };

  const handleSignup = () => {
    if (!signupName.trim()) {
      setFormError('Enter your full name.');
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(signupEmail.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      setFormError('Use a password with at least 8 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setFormError('Your passwords do not match.');
      return;
    }
    if (!/^\\d{6}$/.test(signupPin)) {
      setFormError('Create a 6-digit payment PIN.');
      return;
    }
    setProfileName(signupName.trim());
    setLoginEmail(signupEmail.trim());
    setFormError('');
    setScreen('home');
    haptic();
    notify('Account created in local preview mode.');
  };

  const createWallet = () => {
    const name = walletNameInput.trim();
    if (!name) {
      setFormError('Enter a name for your wallet.');
      return;
    }
    if (wallets.some((wallet) => wallet.name.toLowerCase() === name.toLowerCase())) {
      setFormError('A wallet with that name already exists.');
      return;
    }
    const id = `wallet-${Date.now()}`;
    setWallets((current) => [...current, { id, name, balance: 0 }]);
    setWalletNameInput('');
    setFormError('');
    setScreen('home');
    haptic();
    notify(`${name} wallet created.`);
  };

  const saveWalletName = () => {
    if (!walletOptionsId || !renameValue.trim()) {
      setRenameOpen(false);
      return;
    }
    setWallets((current) =>
      current.map((wallet) =>
        wallet.id === walletOptionsId
          ? { ...wallet, name: renameValue.trim() }
          : wallet,
      ),
    );
    setRenameOpen(false);
    setWalletOptionsId(null);
    notify('Wallet name updated.');
  };

  const toggleWalletStatus = () => {
    if (!walletOptionsId) return;
    const target = wallets.find((wallet) => wallet.id === walletOptionsId);
    const isDisabling = !target?.disabled;
    setWallets((current) =>
      current.map((wallet) =>
        wallet.id === walletOptionsId
          ? { ...wallet, disabled: isDisabling }
          : wallet,
      ),
    );
    setWalletOptionsId(null);
    if (isDisabling && screen === 'walletActivity') setScreen('home');
    notify(isDisabling ? 'Wallet disabled. Its history is preserved.' : 'Wallet enabled.');
  };

  const approvePayment = () => {
    if (!/^\\d{6}$/.test(paymentPin)) {
      setFormError('Enter your 6-digit payment PIN.');
      return;
    }
    const foodWallet = wallets.find((wallet) => wallet.id === 'food');
    if (!foodWallet || foodWallet.balance < PAYMENT_AMOUNT) {
      setFormError('The Food wallet does not have enough balance.');
      return;
    }
    const transaction: Transaction = {
      id: `payment-${Date.now()}`,
      walletId: foodWallet.id,
      title: 'Campus Cafeteria',
      dateGroup: 'Today',
      dateText: 'Today · just now',
      amount: -PAYMENT_AMOUNT,
    };
    setWallets((current) =>
      current.map((wallet) =>
        wallet.id === foodWallet.id
          ? { ...wallet, balance: Math.round((wallet.balance - PAYMENT_AMOUNT) * 100) / 100 }
          : wallet,
      ),
    );
    setTransactions((current) => [transaction, ...current]);
    setPaymentPin('');
    setFormError('');
    setScreen('home');
    haptic();
    notify('Payment approved in local preview mode.');
  };

  const selectedTransactions = selectedWallet
    ? visibleActivity.filter((item) => item.walletId === selectedWallet.id)
    : [];

  const safeScreenStyle = {
    flex: 1 as const,
    backgroundColor: colors.background,
  };

  return (
    <View style={safeScreenStyle}>
      <StatusBar style="dark" />
      {screen === 'login' ? (
        <LoginScreen
          topInset={topInset}
          bottomInset={bottomInset}
          email={loginEmail}
          setEmail={setLoginEmail}
          password={loginPassword}
          setPassword={setLoginPassword}
          error={formError}
          onLogin={handleLogin}
          onSignup={() => {
            setFormError('');
            setScreen('signup');
          }}
          onForgot={() => notify('Password reset is not connected in preview mode.')}
        />
      ) : null}

      {screen === 'signup' ? (
        <SignupScreen
          topInset={topInset}
          bottomInset={bottomInset}
          name={signupName}
          setName={setSignupName}
          email={signupEmail}
          setEmail={setSignupEmail}
          password={signupPassword}
          setPassword={setSignupPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          pin={signupPin}
          setPin={setSignupPin}
          error={formError}
          onBack={() => {
            setFormError('');
            setScreen('login');
          }}
          onCreate={handleSignup}
        />
      ) : null}

      {screen === 'home' ? (
        <HomeScreen
          wallets={wallets}
          topInset={topInset}
          bottomInset={bottomInset}
          onSettings={() => setScreen('settings')}
          onWalletPress={showWallet}
          onWalletOptions={openWalletOptions}
          onAllActivity={() => setScreen('allActivity')}
          onAddWallet={() => {
            setFormError('');
            setScreen('addWallet');
          }}
          onPay={beginPayment}
        />
      ) : null}

      {screen === 'walletActivity' && selectedWallet ? (
        <WalletActivityScreen
          wallet={selectedWallet}
          transactions={selectedTransactions}
          topInset={topInset}
          bottomInset={bottomInset}
          onBack={backToHome}
          onOptions={() => openWalletOptions(selectedWallet)}
        />
      ) : null}

      {screen === 'disabledActivity' && selectedWallet ? (
        <DisabledActivityScreen
          wallet={selectedWallet}
          transactions={selectedTransactions}
          topInset={topInset}
          bottomInset={bottomInset}
          onBack={backToHome}
        />
      ) : null}

      {screen === 'allActivity' ? (
        <AllActivityScreen
          transactions={visibleActivity}
          wallets={wallets}
          topInset={topInset}
          bottomInset={bottomInset}
          onBack={backToHome}
        />
      ) : null}

      {screen === 'qrPayment' ? (
        <QrPaymentScreen
          topInset={topInset}
          bottomInset={bottomInset}
          remaining={qrRemaining}
          nonce={qrNonce}
          onScan={() => {
            if (qrRemaining > 0) {
              setFormError('');
              setScreen('confirmPayment');
            }
          }}
          onCancel={backToHome}
          onRefresh={() => {
            setQrNonce(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
          }}
        />
      ) : null}

      {screen === 'confirmPayment' ? (
        <ConfirmPaymentScreen
          topInset={topInset}
          bottomInset={bottomInset}
          pin={paymentPin}
          setPin={setPaymentPin}
          remainingBalance={
            (wallets.find((wallet) => wallet.id === 'food')?.balance ?? 0) -
            PAYMENT_AMOUNT
          }
          error={formError}
          onBack={() => {
            setFormError('');
            setScreen('qrPayment');
          }}
          onApprove={approvePayment}
          onCancel={backToHome}
          onBiometric={() => notify('Biometric approval is not set up in preview mode.')}
        />
      ) : null}

      {screen === 'settings' ? (
        <SettingsScreen
          topInset={topInset}
          bottomInset={bottomInset}
          profileName={profileName}
          twoFactor={twoFactor}
          paymentNotifications={paymentNotifications}
          offlineLimit={offlineLimit}
          onBack={backToHome}
          onProfile={() =>
            notify(profileName ? `Signed in as ${profileName}.` : 'Student profile is ready to set up.')
          }
          onToggleTwoFactor={() => {
            setTwoFactor((value) => !value);
            notify(`Two-factor authentication ${twoFactor ? 'disabled' : 'enabled'}.`);
          }}
          onEditLimit={() => {
            setLimitValue(String(offlineLimit));
            setLimitEditorOpen(true);
          }}
          onToggleNotifications={() => {
            setPaymentNotifications((value) => !value);
            notify(`Payment notifications ${paymentNotifications ? 'paused' : 'enabled'}.`);
          }}
          onAccountDetails={() =>
            notify('Bank details are not connected in local preview mode.')
          }
          onAbout={() => notify('Student Wallet · design preview')}
          onLogout={() => {
            setFormError('');
            setLoginPassword('');
            setScreen('login');
          }}
        />
      ) : null}

      {screen === 'addWallet' ? (
        <AddWalletScreen
          topInset={topInset}
          bottomInset={bottomInset}
          value={walletNameInput}
          setValue={setWalletNameInput}
          error={formError}
          onBack={backToHome}
          onCreate={createWallet}
        />
      ) : null}

      <WalletOptionsSheet
        wallet={walletOptions}
        bottomInset={bottomInset}
        onClose={() => setWalletOptionsId(null)}
        onRename={() => {
          if (!walletOptions) return;
          setRenameValue(walletOptions.name);
          setRenameOpen(true);
        }}
        onToggleStatus={toggleWalletStatus}
      />

      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameOpen(false)}
      >
        <View style={[modalStyles.backdrop, { backgroundColor: colors.scrim }]}>
          <View
            style={[
              modalStyles.dialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[modalStyles.dialogTitle, { color: colors.foreground }]}>
              Rename wallet
            </Text>
            <TextInput
              accessibilityLabel="Wallet name"
              testID="rename-wallet-input"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              maxLength={28}
              placeholder="Wallet name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                modalStyles.dialogInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={modalStyles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                testID="cancel-rename"
                onPress={() => setRenameOpen(false)}
                style={modalStyles.dialogAction}
              >
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="save-rename"
                onPress={saveWalletName}
                style={modalStyles.dialogAction}
              >
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={limitEditorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLimitEditorOpen(false)}
      >
        <View style={[modalStyles.backdrop, { backgroundColor: colors.scrim }]}>
          <View
            style={[
              modalStyles.dialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[modalStyles.dialogTitle, { color: colors.foreground }]}>
              Offline payment limit
            </Text>
            <TextInput
              accessibilityLabel="Maximum amount per order"
              testID="offline-limit-input"
              value={limitValue}
              onChangeText={setLimitValue}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={colors.mutedForeground}
              style={[
                modalStyles.dialogInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={modalStyles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                testID="cancel-limit"
                onPress={() => setLimitEditorOpen(false)}
                style={modalStyles.dialogAction}
              >
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="save-limit"
                onPress={() => {
                  const value = Number(limitValue.replace(',', '.'));
                  if (!Number.isFinite(value) || value <= 0) {
                    notify('Enter a limit greater than zero.');
                    return;
                  }
                  setOfflineLimit(Math.round(value * 100) / 100);
                  setLimitEditorOpen(false);
                  notify('Offline payment limit updated.');
                }}
                style={modalStyles.dialogAction}
              >
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {notice ? (
        <Pressable
          accessibilityRole="alert"
          testID="notice"
          onPress={() => setNotice('')}
          style={[
            styles.notice,
            {
              bottom: bottomInset + 12,
              backgroundColor: colors.foreground,
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: colors.primaryForeground }]}>
            {notice}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LoginScreen({
  topInset,
  bottomInset,
  email,
  setEmail,
  password,
  setPassword,
  error,
  onLogin,
  onSignup,
  onForgot,
}: {
  topInset: number;
  bottomInset: number;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  onLogin: () => void;
  onSignup: () => void;
  onForgot: () => void;
}) {
  const colors = useColors();
  return (
    <KeyboardAwareScrollViewCompat
      style={styles.flex}
      contentContainerStyle={[
        styles.loginContent,
        { paddingTop: topInset + 24, paddingBottom: bottomInset + 22 },
      ]}
      bottomOffset={60}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.brand, { color: colors.primary }]}>WALLET</Text>
      <View style={styles.loginIntro}>
        <Text style={[styles.loginTitle, { color: colors.foreground }]}>
          Welcome back
        </Text>
        <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
          Sign in to your student wallet
        </Text>
      </View>
      <View style={styles.loginForm}>
        <Field
          label="University email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@university.edu"
          testID="login-email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••••"
          testID="login-password"
          secureTextEntry
        />
        <Pressable
          accessibilityRole="button"
          testID="forgot-password"
          onPress={onForgot}
          style={styles.forgotButton}
        >
          <Text style={[styles.smallLink, { color: colors.primary }]}>
            Forgot password?
          </Text>
        </Pressable>
        <InlineError message={error} />
        <PrimaryButton label="Log in" testID="login-submit" onPress={onLogin} />
      </View>
      <Pressable
        accessibilityRole="button"
        testID="open-signup"
        onPress={onSignup}
        style={styles.loginFooter}
      >
        <Text style={[styles.smallLink, { color: colors.foreground }]}>
          New here? <Text style={{ color: colors.primary }}>Create account</Text>
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

function SignupScreen({
  topInset,
  bottomInset,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  pin,
  setPin,
  error,
  onBack,
  onCreate,
}: {
  topInset: number;
  bottomInset: number;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
  error: string;
  onBack: () => void;
  onCreate: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <PageHeader title="Create account" onBack={onBack} />
      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: bottomInset + 32 },
        ]}
        bottomOffset={60}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.supportingText, { color: colors.mutedForeground, marginBottom: 30 }]}>
          Set up your wallet account
        </Text>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          testID="signup-name"
          autoCapitalize="words"
        />
        <Field
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          testID="signup-email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          testID="signup-password"
          secureTextEntry
        />
        <Field
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Enter password again"
          testID="signup-password-confirm"
          secureTextEntry
        />
        <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
        <SectionLabel>PAYMENT SECURITY</SectionLabel>
        <Text style={[styles.formSectionTitle, { color: colors.foreground }]}>
          Create a payment PIN
        </Text>
        <Text style={[styles.supportingText, { color: colors.mutedForeground, marginBottom: 16 }]}>
          Use this PIN to approve payments. You can enable biometrics later.
        </Text>
        <Field
          label="6-digit PIN"
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\\D/g, '').slice(0, 6))}
          placeholder="••••••"
          testID="signup-pin"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
        />
        <InlineError message={error} />
        <PrimaryButton label="Create account" testID="signup-submit" onPress={onCreate} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function HomeScreen({
  wallets,
  topInset,
  bottomInset,
  onSettings,
  onWalletPress,
  onWalletOptions,
  onAllActivity,
  onAddWallet,
  onPay,
}: {
  wallets: Wallet[];
  topInset: number;
  bottomInset: number;
  onSettings: () => void;
  onWalletPress: (wallet: Wallet) => void;
  onWalletOptions: (wallet: Wallet) => void;
  onAllActivity: () => void;
  onAddWallet: () => void;
  onPay: () => void;
}) {
  const colors = useColors();
  const main = wallets.find((wallet) => wallet.id === 'main');
  const activeWallets = wallets.filter(
    (wallet) => wallet.id !== 'main' && !wallet.disabled,
  );
  const disabledWallets = wallets.filter((wallet) => wallet.disabled);
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: topInset + 15,
          paddingHorizontal: 24,
          paddingBottom: bottomInset + 112,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.homeHeading}>
          <Text style={[styles.homeTitle, { color: colors.foreground }]}>
            My wallets
          </Text>
          <View
            style={[
              styles.settingsCircle,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <IconButton
              name="settings"
              label="Settings"
              testID="open-settings"
              onPress={onSettings}
            />
          </View>
        </View>
        <Text style={[styles.supportingText, { color: colors.mutedForeground, marginTop: 4 }]}>
          Your available balances
        </Text>
        {main ? (
          <View style={{ marginTop: 20 }}>
            <WalletCard
              wallet={main}
              main
              onPress={() => onWalletPress(main)}
              onOptions={() => onWalletOptions(main)}
            />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          testID="open-all-activity"
          onPress={onAllActivity}
          style={styles.allActivityLink}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>All activity</Text>
          <Feather name="arrow-right" size={16} color={colors.primary} />
        </Pressable>
        <View style={styles.sectionHeading}>
          <SectionLabel>SUB-WALLETS</SectionLabel>
          <Pressable
            accessibilityRole="button"
            testID="add-wallet"
            onPress={onAddWallet}
            hitSlop={8}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>+ Add</Text>
          </Pressable>
        </View>
        <View style={styles.walletGrid}>
          {activeWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onPress={() => onWalletPress(wallet)}
              onOptions={() => onWalletOptions(wallet)}
            />
          ))}
        </View>
        {disabledWallets.length ? (
          <>
            <View style={{ marginTop: 17, marginBottom: 10 }}>
              <SectionLabel>DISABLED WALLETS</SectionLabel>
            </View>
            <View style={{ gap: 10 }}>
              {disabledWallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onPress={() => onWalletPress(wallet)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <View style={[styles.fixedAction, { bottom: bottomInset + 20 }]}>
        <PrimaryButton label="PAY" testID="start-payment" onPress={onPay} />
      </View>
    </View>
  );
}

function WalletActivityScreen({
  wallet,
  transactions,
  topInset,
  bottomInset,
  onBack,
  onOptions,
}: {
  wallet: Wallet;
  transactions: Transaction[];
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onOptions: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader
          title={wallet.id === 'main' ? 'Main wallet' : `${wallet.name} wallet`}
          onBack={onBack}
          right={
            <IconButton
              name="more-horizontal"
              label={`${wallet.name} wallet options`}
              testID="wallet-detail-options"
              onPress={onOptions}
            />
          }
        />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: 22,
          paddingHorizontal: 24,
          paddingBottom: bottomInset + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.detailBalance, { color: colors.foreground }]}>
          {formatMoney(wallet.balance)}
        </Text>
        <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
          Available balance
        </Text>
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SectionLabel>ACTIVITY</SectionLabel>
        {transactions.length ? (
          <TransactionGroups transactions={transactions} wallets={[wallet]} />
        ) : (
          <EmptyActivity />
        )}
      </ScrollView>
    </View>
  );
}

function DisabledActivityScreen({
  wallet,
  transactions,
  topInset,
  bottomInset,
  onBack,
}: {
  wallet: Wallet;
  transactions: Transaction[];
  topInset: number;
  bottomInset: number;
  onBack: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader title={`${wallet.name} wallet`} onBack={onBack} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 24,
          paddingBottom: bottomInset + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.disabledBadge, { backgroundColor: colors.disabledSurface }]}>
          <Text style={[styles.disabledBadgeText, { color: colors.disabledText }]}>
            DISABLED
          </Text>
        </View>
        <Text style={[styles.detailBalance, { color: colors.foreground, marginTop: 20 }]}>
          {formatMoney(wallet.balance)}
        </Text>
        <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
          Wallet disabled · History preserved
        </Text>
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SectionLabel>ACTIVITY</SectionLabel>
        {transactions.length ? (
          <TransactionGroups transactions={transactions} wallets={[wallet]} />
        ) : (
          <EmptyActivity />
        )}
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          This wallet is inactive. You can still view its past transactions.
        </Text>
      </ScrollView>
    </View>
  );
}

function AllActivityScreen({
  transactions,
  wallets,
  topInset,
  bottomInset,
  onBack,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  topInset: number;
  bottomInset: number;
  onBack: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader title="All activity" onBack={onBack} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: 15,
          paddingHorizontal: 24,
          paddingBottom: bottomInset + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.supportingText, { color: colors.mutedForeground, marginBottom: 24 }]}>
          Every transaction across your wallets
        </Text>
        <TransactionGroups transactions={transactions} wallets={wallets} showWallet />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
          Amounts and wallet labels reflect each ledger entry.
        </Text>
      </ScrollView>
    </View>
  );
}

function TransactionGroups({
  transactions,
  wallets,
  showWallet = false,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  showWallet?: boolean;
}) {
  const colors = useColors();
  const groups = transactions.reduce<Record<string, Transaction[]>>((acc, item) => {
    acc[item.dateGroup] = [...(acc[item.dateGroup] ?? []), item];
    return acc;
  }, {});
  return (
    <View style={{ marginTop: 18 }}>
      {Object.entries(groups).map(([group, items]) => (
        <View key={group} style={{ marginBottom: 16 }}>
          <SectionLabel>{group.toUpperCase()}</SectionLabel>
          <View style={{ marginTop: 3 }}>
            {items.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                walletName={wallets.find((wallet) => wallet.id === transaction.walletId)?.name}
                showWallet={showWallet}
                last={index === items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
      {!transactions.length ? (
        <Text style={{ color: colors.mutedForeground, marginTop: 20 }}>
          No transactions yet.
        </Text>
      ) : null}
    </View>
  );
}

function EmptyActivity() {
  const colors = useColors();
  return (
    <View style={[styles.emptyActivity, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="clock" size={22} color={colors.mutedForeground} />
      <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
        Transactions will appear here.
      </Text>
    </View>
  );
}

function QrPaymentScreen({
  topInset,
  bottomInset,
  remaining,
  nonce,
  onScan,
  onCancel,
  onRefresh,
}: {
  topInset: number;
  bottomInset: number;
  remaining: number;
  nonce: string;
  onScan: () => void;
  onCancel: () => void;
  onRefresh: () => void;
}) {
  const colors = useColors();
  const expired = remaining <= 0;
  return (
    <View style={[styles.flex, { backgroundColor: colors.card, paddingTop: topInset }]}>
      <View style={styles.qrContent}>
        <Text style={[styles.supportingText, { color: colors.mutedForeground, textAlign: 'center' }]}>
          Show this code at the payment terminal
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Demo payment QR code"
          accessibilityHint="Tap to simulate a payment terminal scan."
          testID="simulate-qr-scan"
          onPress={onScan}
          style={({ pressed }) => [
            styles.qrFrame,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          {expired ? (
            <View style={styles.expiredCode}>
              <Feather name="refresh-cw" size={28} color={colors.mutedForeground} />
              <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
                Code expired
              </Text>
            </View>
          ) : (
            <QRCode
              value={`student-wallet-demo:${nonce}:EUR:${PAYMENT_AMOUNT.toFixed(2)}`}
              size={231}
              color={colors.foreground}
              backgroundColor={colors.card}
              ecl="M"
            />
          )}
        </Pressable>
        <Text style={[styles.supportingText, { color: colors.mutedForeground, marginTop: 32 }]}>
          Expires in
        </Text>
        <Text style={[styles.qrTimer, { color: colors.primary }]}>
          {`00:${String(remaining).padStart(2, '0')}`}
        </Text>
        <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
          This one-time code expires automatically
        </Text>
        {expired ? (
          <Pressable
            accessibilityRole="button"
            testID="refresh-qr"
            onPress={onRefresh}
            style={{ marginTop: 14, padding: 10 }}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Refresh code</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.fixedAction, { bottom: bottomInset + 20 }]}>
        <PrimaryButton label="Cancel" testID="cancel-payment" onPress={onCancel} />
      </View>
    </View>
  );
}

function ConfirmPaymentScreen({
  topInset,
  bottomInset,
  pin,
  setPin,
  remainingBalance,
  error,
  onBack,
  onApprove,
  onCancel,
  onBiometric,
}: {
  topInset: number;
  bottomInset: number;
  pin: string;
  setPin: (value: string) => void;
  remainingBalance: number;
  error: string;
  onBack: () => void;
  onApprove: () => void;
  onCancel: () => void;
  onBiometric: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader title="Confirm payment" onBack={onBack} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 15, paddingBottom: bottomInset + 130 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>
          Review the details before approving
        </Text>
        <SectionLabel>PAYMENT AMOUNT</SectionLabel>
        <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
          {formatMoney(PAYMENT_AMOUNT)}
        </Text>
        <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
          Campus Cafeteria
        </Text>
        <Text style={[styles.transactionMeta, { color: colors.mutedForeground, marginTop: 4 }]}>
          Today · 12:42
        </Text>
        <View style={[styles.paymentDetails, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.paymentDetailRow}>
            <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>Pay from</Text>
            <Text style={[styles.paymentDetailValue, { color: colors.foreground }]}>Food wallet</Text>
          </View>
          <View style={[styles.pageDivider, { backgroundColor: colors.border, marginVertical: 0 }]} />
          <View style={styles.paymentDetailRow}>
            <Text style={[styles.supportingText, { color: colors.mutedForeground }]}>Remaining balance</Text>
            <Text style={[styles.paymentDetailValue, { color: colors.foreground }]}>
              {formatMoney(Math.max(0, remainingBalance))}
            </Text>
          </View>
        </View>
        <SectionLabel>AUTHORISE PAYMENT</SectionLabel>
        <Text style={[styles.supportingText, { color: colors.foreground, marginTop: 9, marginBottom: 12 }]}>
          Enter your 6-digit payment PIN
        </Text>
        <TextInput
          accessibilityLabel="6-digit payment PIN"
          testID="payment-pin"
          value={pin}
          onChangeText={(value) => setPin(value.replace(/\\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          style={[
            styles.pinInput,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          testID="use-biometrics"
          onPress={onBiometric}
          style={{ alignSelf: 'flex-start', paddingVertical: 17 }}
        >
          <Text style={[styles.smallLink, { color: colors.primary }]}>
            Use Face ID / fingerprint
          </Text>
        </Pressable>
        <InlineError message={error} />
      </ScrollView>
      <View style={[styles.paymentFooter, { paddingBottom: bottomInset + 12 }]}>
        <PrimaryButton
          label="Approve payment"
          testID="approve-payment"
          onPress={onApprove}
          disabled={pin.length !== 6}
        />
        <Pressable
          accessibilityRole="button"
          testID="cancel-payment-confirm"
          onPress={onCancel}
          style={styles.cancelTextButton}
        >
          <Text style={[styles.smallLink, { color: colors.mutedForeground }]}>
            Cancel payment
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingsScreen({
  topInset,
  bottomInset,
  profileName,
  twoFactor,
  paymentNotifications,
  offlineLimit,
  onBack,
  onProfile,
  onToggleTwoFactor,
  onEditLimit,
  onToggleNotifications,
  onAccountDetails,
  onAbout,
  onLogout,
}: {
  topInset: number;
  bottomInset: number;
  profileName: string;
  twoFactor: boolean;
  paymentNotifications: boolean;
  offlineLimit: number;
  onBack: () => void;
  onProfile: () => void;
  onToggleTwoFactor: () => void;
  onEditLimit: () => void;
  onToggleNotifications: () => void;
  onAccountDetails: () => void;
  onAbout: () => void;
  onLogout: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader title="Settings" onBack={onBack} />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>ACCOUNT</SectionLabel>
        <SettingsRow
          title="Student profile"
          subtitle={profileName || 'Student details and university'}
          onPress={onProfile}
        />
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SectionLabel>SECURITY</SectionLabel>
        <SettingsRow title="Two-factor authentication" value={twoFactor ? 'Enabled' : 'Off'} onPress={onToggleTwoFactor} />
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SettingsRow
          title="Offline payment limit"
          subtitle="Maximum amount per order"
          value={formatMoney(offlineLimit)}
          onPress={onEditLimit}
        />
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SectionLabel>NOTIFICATIONS</SectionLabel>
        <SettingsRow
          title="Payment notifications"
          subtitle="Top-up and refund updates"
          value={paymentNotifications ? 'On' : 'Off'}
          onPress={onToggleNotifications}
        />
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SettingsRow
          title="Account details"
          subtitle="IBAN and linked account information"
          onPress={onAccountDetails}
        />
        <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
        <SettingsRow title="About" onPress={onAbout} />
        <PrimaryButton
          label="Log out"
          testID="logout"
          onPress={onLogout}
          style={{ marginTop: 48 }}
        />
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  title,
  subtitle,
  value,
  onPress,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      testID={`setting-${title.toLowerCase().replaceAll(' ', '-')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.settingsCopy}>
        <Text style={[styles.transactionTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.transactionMeta, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.settingsValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : (
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

function AddWalletScreen({
  topInset,
  bottomInset,
  value,
  setValue,
  error,
  onBack,
  onCreate,
}: {
  topInset: number;
  bottomInset: number;
  value: string;
  setValue: (value: string) => void;
  error: string;
  onBack: () => void;
  onCreate: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: topInset + 8 }]}>
      <View style={styles.pagePadding}>
        <PageHeader title="New wallet" onBack={onBack} />
      </View>
      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 36,
          paddingBottom: bottomInset + 104,
        }}
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="WALLET NAME"
          value={value}
          onChangeText={setValue}
          placeholder="e.g. Groceries"
          testID="new-wallet-name"
          autoCapitalize="words"
        />
        <Text style={[styles.transactionMeta, { color: colors.mutedForeground, marginTop: -9 }]}>
          Each wallet has its own balance and transaction history.
        </Text>
        <InlineError message={error} />
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.fixedAction, { bottom: bottomInset + 20 }]}>
        <PrimaryButton label="Create wallet" testID="create-wallet" onPress={onCreate} />
      </View>
    </View>
  );
}

function WalletOptionsSheet({
  wallet,
  bottomInset,
  onClose,
  onRename,
  onToggleStatus,
}: {
  wallet?: Wallet;
  bottomInset: number;
  onClose: () => void;
  onRename: () => void;
  onToggleStatus: () => void;
}) {
  const colors = useColors();
  return (
    <Modal
      visible={Boolean(wallet)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[modalStyles.sheetBackdrop, { backgroundColor: colors.scrim }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close wallet options"
          testID="wallet-options-backdrop"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            modalStyles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(bottomInset, 16) + 10,
            },
          ]}
        >
          <View style={[modalStyles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[modalStyles.sheetTitle, { color: colors.foreground }]}>
            {wallet?.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="rename-wallet"
            onPress={onRename}
            style={modalStyles.sheetRow}
          >
            <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
              Rename wallet
            </Text>
            <Feather name="edit-2" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.pageDivider, { backgroundColor: colors.border }]} />
          <Pressable
            accessibilityRole="button"
            testID="toggle-wallet-status"
            onPress={onToggleStatus}
            style={modalStyles.sheetRow}
          >
            <View>
              <Text
                style={[
                  styles.transactionTitle,
                  { color: wallet?.disabled ? colors.primary : colors.destructive },
                ]}
              >
                {wallet?.disabled ? 'Enable wallet' : 'Disable wallet'}
              </Text>
              <Text style={[styles.transactionMeta, { color: colors.mutedForeground, marginTop: 5 }]}>
                Transactions remain available
              </Text>
            </View>
            <Feather
              name={wallet?.disabled ? 'check-circle' : 'slash'}
              size={17}
              color={wallet?.disabled ? colors.primary : colors.destructive}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="close-wallet-options"
            onPress={onClose}
            style={[modalStyles.cancelSheet, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.transactionMeta, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InlineError({ message }: { message: string }) {
  const colors = useColors();
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.destructive }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pagePadding: {
    paddingHorizontal: 24,
  },
  loginContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  brand: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 1.3,
  },
  loginIntro: {
    marginTop: 112,
    marginBottom: 52,
  },
  loginTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 3,
  },
  supportingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  transactionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  transactionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  loginForm: {
    gap: 0,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    marginTop: -10,
    marginBottom: 54,
  },
  smallLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  loginFooter: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 20,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 19,
  },
  formDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 2,
    marginBottom: 22,
  },
  formSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 6,
  },
  homeHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 25,
    lineHeight: 32,
  },
  settingsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allActivityLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    marginTop: 1,
    marginBottom: 5,
  },
  linkText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fixedAction: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  detailBalance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 42,
    marginBottom: 2,
  },
  pageDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 23,
  },
  emptyActivity: {
    marginTop: 20,
    minHeight: 116,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabledBadge: {
    alignSelf: 'flex-start',
    minWidth: 94,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  disabledBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 22,
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  qrFrame: {
    width: 261,
    height: 261,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 112,
  },
  expiredCode: {
    alignItems: 'center',
    gap: 12,
  },
  qrTimer: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 42,
    marginTop: 8,
    marginBottom: 3,
  },
  paymentAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 52,
    marginTop: 10,
  },
  paymentDetails: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    marginTop: 38,
    marginBottom: 38,
  },
  paymentDetailRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentDetailValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  pinInput: {
    height: 58,
    borderWidth: 1,
    borderRadius: 14,
    textAlign: 'center',
    letterSpacing: 15,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  paymentFooter: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  cancelTextButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingsCopy: {
    flex: 1,
    gap: 4,
  },
  settingsValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  notice: {
    position: 'absolute',
    left: 24,
    right: 24,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  noticeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  dialogTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  dialogInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  dialogAction: {
    minWidth: 76,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    minHeight: 302,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 51,
    height: 4,
    borderRadius: 3,
    marginTop: 14,
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 10,
  },
  sheetRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelSheet: {
    minHeight: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
