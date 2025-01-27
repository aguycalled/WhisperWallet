import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Input,
  Layout,
  TopNavigation,
} from '@tsejerome/ui-kitten-components';
import {
  Container,
  Text,
  TopNavigationComponent,
  BottomSheetView,
  SwipeButton,
  LoadingModalContent,
} from '@components';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Destination_Types_Enum } from '@constants';
import { RootStackParamList } from '@navigation/type';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  useSecurity,
  useWallet,
  useBottomSheet,
  useModal,
  useLayout,
} from '@hooks';
import QRCode from 'react-native-qrcode-svg';
import Gzip from 'rn-gzip';
import Share from 'react-native-share';
import { sellNftStyles as styles } from './styles';

const SellNftScreen = (props: any) => {
  const { CreateSellOrder, parsedAddresses } = useWallet();
  const { readPassword } = useSecurity();

  const { goBack } = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = useLayout();
  const { openModal, closeModal } = useModal();
  const bottomSheet = useBottomSheet();

  const nftCollection = props.route.params.from;
  const nftId = props.route.params.nftId;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (loading) {
      openModal(<LoadingModalContent loading={!!loading} text={loading} />);
      return;
    }
    closeModal();
  }, [loading]);

  const amountInputRef = useRef<Input>();
  const [price, setPrice] = useState<string>('');

  const [destination, setDestination] = useState<string>('');

  useEffect(() => {
    setDestination(
      parsedAddresses.filter(
        el => el.type_id == Destination_Types_Enum.PrivateWallet,
      )[0]?.address,
    );
  }, []);

  const qrCode = useRef<QRCode>();

  const createSellOrder = useCallback(async () => {
    if (!price) {
      setError('Please fill the price details.');
      return;
    }

    setError('');

    readPassword()
      .then(async spendingPassword => {
        setLoading('Creating transaction...');
        CreateSellOrder(
          nftCollection.tokenId,
          nftId,
          destination,
          parseFloat(price) * 1e8,
          spendingPassword,
        )
          .then(tx => {
            setLoading(false);
            bottomSheet.expand(
              <BottomSheetView>
                <TopNavigation title="Confirm sell order" />
                <Layout level="2" style={styles.card}>
                  <View style={styles.row}>
                    <Text category="headline" style={styles.marginRight16}>
                      Collection:
                    </Text>
                    <Text category="headline" style={styles.flexWrap}>
                      {nftCollection.name}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text category="headline" style={styles.marginRight16}>
                      Item:
                    </Text>
                    <Text category="headline" style={styles.flexWrap}>
                      #{nftId}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text category="headline" style={styles.marginRight16}>
                      Price:
                    </Text>
                    <Text category="headline" style={styles.flexWrap}>
                      {price} xNAV
                    </Text>
                  </View>
                </Layout>

                <SwipeButton
                  goBackToStart={true}
                  onComplete={() => {
                    bottomSheet.expand(
                      <BottomSheetView>
                        <Text
                          center
                          category={'title4'}
                          style={styles.marginBottom24}>
                          Share the following QR code with your buyer:
                        </Text>
                        <QRCode
                          getRef={r => {
                            qrCode.current = r;
                          }}
                          quietZone={10}
                          value={'gzo:' + Gzip.zip(JSON.stringify(tx))}
                          size={width * 0.9}
                        />
                        <Button
                          style={styles.marginTop24}
                          status={'primary-whisper'}
                          children={'Share'}
                          onPress={() => {
                            if (qrCode.current) {
                              qrCode.current?.toDataURL(base => {
                                Share.open({
                                  url: 'data:image/svg+xml;base64,' + base,
                                })
                                  .then(res => {
                                    setError('');
                                    bottomSheet.collapse();
                                    goBack();
                                  })
                                  .catch(err => {
                                    setError(err.toString());
                                    bottomSheet.collapse();
                                    err && console.log(err);
                                  });
                              });
                            }
                          }}
                        />
                      </BottomSheetView>,
                    );
                  }}
                  title="Swipe to confirm"
                />
              </BottomSheetView>,
            );
          })
          .catch(e => {
            console.log(e.stack);
            bottomSheet.expand(
              <BottomSheetView>
                <Text center style={styles.paddingBottom16}>
                  Unable to create sell order
                </Text>
                <Text center style={styles.paddingBottom16}>
                  {e.message}
                </Text>
              </BottomSheetView>,
            );
            setLoading(false);
          });
      })
      .catch(e => {
        setLoading(false);

        bottomSheet.expand(
          <BottomSheetView>
            <Text center style={styles.paddingBottom16}>
              Unable to create sell order
            </Text>
            <Text center style={styles.paddingBottom16}>
              {e.message}
            </Text>
          </BottomSheetView>,
        );
      });
  }, [qrCode, price]);

  return (
    <Container useSafeArea>
      <KeyboardAwareScrollView>
        <TopNavigationComponent title={'Create a NFT sell order'} />

        <Layout level="2" style={styles.inputCard}>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Collection:
            </Text>
            <Text category="headline" style={[styles.inputTitle]}>
              {nftCollection.name}
            </Text>
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Item:
            </Text>
            <Text category="headline" style={[styles.inputTitle]}>
              #{nftId}
            </Text>
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Price:
            </Text>
            <View style={styles.inputWrapper}>
              <Input
                ref={amountInputRef}
                keyboardType={'decimal-pad'}
                returnKeyType={'done'}
                status={'transparent'}
                value={price}
                placeholder={'0'}
                onChangeText={(text: string) => {
                  let t = 0;
                  let res = text.replace(/\./g, match =>
                    ++t === 2 ? '' : match,
                  );
                  setPrice(res.trim().replace(',', '.'));
                }}
              />
              <Text style={styles.xnavText}>xNAV</Text>
            </View>
          </View>
          <Button
            status={'primary-whisper'}
            onPress={() => {
              createSellOrder();
            }}>
            {'Create sell order'}
          </Button>
          {error ? (
            <Text style={[styles.errorText]} center>
              {error}
            </Text>
          ) : (
            <></>
          )}
        </Layout>
      </KeyboardAwareScrollView>
    </Container>
  );
};
export default SellNftScreen;
