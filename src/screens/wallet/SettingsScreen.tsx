import React, { useEffect, useState } from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Animation_Types_Enum } from '@constants';
import { RootStackParamList, ScreenProps } from '@navigation/type';
import {
  DeleteWalletModalContent,
  BottomSheetOptions,
  TopNavigationComponent,
  LoadingModalContent,
  OptionCard,
  Container,
} from '@components';
import { screenHeight } from '@utils';
import { scale } from 'react-native-size-matters';
import { useSecurity, useWallet, useModal } from '@hooks';
import { GetAuthenticationName, SecurityAuthenticationTypes } from '@contexts';
import { useBottomSheet, useExchangeRate } from '@hooks';
import { useTheme } from '@tsejerome/ui-kitten-components';
import { settingScreenStyles as styles } from './styles';
interface SettingsItem {
  title: string;
  onPress: () => void;
  icon?: string;
  colorType?: string;
  show?: boolean;
  rightElement?: any;
}

const SettingsScreen = (props: ScreenProps<'SettingsScreen'>) => {
  const { readPassword } = useSecurity();
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const {
    walletName,
    createWallet,
    closeWallet,
    removeWallet,
    ExecWrapperPromise,
  } = useWallet();
  const bottomSheet = useBottomSheet();
  const {
    changeMode,
    supportedType,
    currentAuthenticationType,
    lockAfterBackground,
    setLockAfterBackground,
  } = useSecurity();
  const [authTypes, setAuthTypes] = useState<any>([]);
  const theme = useTheme();

  useEffect(() => {
    let deviceAuth = [];
    if (
      supportedType == SecurityAuthenticationTypes.KEYCHAIN ||
      supportedType == SecurityAuthenticationTypes.LOCALAUTH
    ) {
      deviceAuth = [
        {
          text: GetAuthenticationName(supportedType),
          mode: supportedType,
          icon: 'biometrics',
        },
      ];
    }

    deviceAuth.push(
      {
        text: GetAuthenticationName(SecurityAuthenticationTypes.MANUAL_4),
        mode: SecurityAuthenticationTypes.MANUAL_4,
        icon: 'pincode',
      },
      {
        text: GetAuthenticationName(SecurityAuthenticationTypes.MANUAL),
        mode: SecurityAuthenticationTypes.MANUAL,
        icon: 'pincode',
      },
      {
        text: GetAuthenticationName(SecurityAuthenticationTypes.NONE),
        mode: SecurityAuthenticationTypes.NONE,
        icon: 'unsecure',
      },
    );

    deviceAuth = deviceAuth.filter(el => el.text != currentAuthenticationType);

    setAuthTypes(deviceAuth);
  }, [supportedType, currentAuthenticationType]);

  const { navigate, goBack } =
    useNavigation<NavigationProp<RootStackParamList>>();

  const { openModal, closeModal } = useModal();

  const disconnectWallet = async (deleteWallet: boolean = false) => {
    closeWallet();
    if (deleteWallet) {
      await removeWallet(walletName);
    }
    navigate('Intro');
    setLoading(false);
  };

  const resyncWallet = () => {
    try {
      closeWallet();
    } catch (e) {}

    readPassword().then((password: string) => {
      setLoading('Restarting...');

      createWallet(
        walletName,
        '',
        '',
        password,
        password,
        true,
        true,
        '',
        () => {
          setTimeout(() => {
            setLoading(false);
            goBack();
          }, 500);
        },
      );
    });
  };

  const leaveWallet = () => disconnectWallet();

  const deleteWallet = () => {
    openModal(
      <DeleteWalletModalContent
        walletName={walletName}
        deleteWallet={() => {
          readPassword().then((password: string) => {
            setLoading('Deleting...');
            disconnectWallet(true);
          });
        }}
      />,
    );
  };

  const { selectedCurrency, updateCurrency } = useExchangeRate();

  const items: SettingsItem[] = [
    {
      title: 'Currency',
      icon: 'money',
      show: true,
      onPress: () => {
        navigate('DisplayCurrencyScreen');
      },
    },
    {
      title: 'Staking nodes',
      icon: 'factory',
      show: true,
      onPress: () => {
        navigate('StakingNodeScreen');
      },
    },
    {
      title: 'Electrum servers',
      icon: 'book',
      show: true,
      onPress: () => {
        navigate('ServersScreen');
      },
    },
    {
      title: 'Security: ' + GetAuthenticationName(currentAuthenticationType),
      icon: 'pincode',
      show: true,
      onPress: () => {
        bottomSheet.expand(
          <BottomSheetOptions
            title={'Select a new authentication mode'}
            options={authTypes}
            bottomSheetRef={bottomSheet.getRef}
            onSelect={(el: any) => {
              changeMode(el.mode);
            }}
          />,
        );
      },
    },
    {
      title: 'Auto-lock',
      icon: 'eye',
      show: currentAuthenticationType != SecurityAuthenticationTypes.NONE,
      rightElement: (
        <Switch
          trackColor={{ false: '#fff', true: theme['color-staking'] }}
          onValueChange={val => {
            setLockAfterBackground(!lockAfterBackground);
          }}
          value={lockAfterBackground}
          style={{ marginRight: scale(12) }}
        />
      ),
      onPress: () => {
        setLockAfterBackground(!lockAfterBackground);
      },
    },
    {
      title: 'Show mnemonic',
      icon: 'padLock',
      show: true,
      onPress: () => {
        readPassword().then(async (password: string) => {
          const updatedMnemonic: string = await ExecWrapperPromise(
            'wallet.db.GetMasterKey',
            ['mnemonic', password].map(el => JSON.stringify(el)),
          );
          navigate('MnemonicScreen', {
            mnemonic: updatedMnemonic,
          });
        });
      },
    },
    {
      title: 'Clear history and resync',
      icon: 'refresh',
      show: true,
      onPress: () => resyncWallet(),
    },
    {
      title: 'Error Logs',
      icon: 'search',
      show: true,
      onPress: () => {
        navigate('ErrorLogsScreen');
      },
    },
    {
      title: 'Close wallet',
      icon: 'cancel',
      show: true,
      onPress: () => leaveWallet(),
    },
    {
      title: 'Delete wallet',
      icon: 'bin',
      show: true,
      onPress: () => deleteWallet(),
    },
  ];

  useEffect(() => {
    if (loading) {
      openModal(<LoadingModalContent loading={!!loading} text={loading} />);
      return;
    }
    closeModal();
  }, [loading]);

  const height = { height: screenHeight };
  return (
    <Container useSafeArea>
      <TopNavigationComponent title={'Settings'} />
      <ScrollView style={[styles.contentWrapper, height]}>
        {items.map((item, index) => {
          if (!item.show) {
            return <View key={index} />;
          }
          return (
            <OptionCard
              key={index}
              id={index.toString()}
              index={index}
              item={{ text: item.title }}
              selected={'walletName'}
              onPress={item.onPress}
              animationType={Animation_Types_Enum.SlideInLeft}
              icon={item.icon || 'download'}
              rightElement={item.rightElement}
              color={item.colorType || 'white'}
            />
          );
        })}
      </ScrollView>
    </Container>
  );
};

export default SettingsScreen;
