import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Input,
  Layout,
  TopNavigation,
} from '@tsejerome/ui-kitten-components';
import {
  Container,
  TopNavigationComponent,
  Text,
  BottomSheetView,
  SwipeButton,
  LoadingModalContent,
} from '@components';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { CollectionOption } from '@constants';
import { RootStackParamList } from '@navigation/type';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useBottomSheet, useModal, useSecurity, useWallet } from '@hooks';
import { createNftCollectionStyles as styles } from './styles';

const CreateNftCollectionScreen = () => {
  const { createNftCollection, sendTransaction } = useWallet();
  const { readPassword } = useSecurity();

  const { goBack } = useNavigation<NavigationProp<RootStackParamList>>();
  const { collapse } = useBottomSheet();
  const { openModal, closeModal } = useModal();
  const bottomSheet = useBottomSheet();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (loading) {
      openModal(<LoadingModalContent loading={!!loading} text={loading} />);
      return;
    }
    closeModal();
  }, [loading]);

  const [collection, setCollection] = useState<CollectionOption>({
    name: '',
    description: '',
    amount: 1,
  });

  const setCollectionProperty = (
    type: keyof CollectionOption,
    value: string | number,
  ) => {
    const temp = { ...collection };
    temp[type] = value as any;
    setCollection(temp);
  };

  const createCollection = async () => {
    if (!collection?.name || !collection?.description) {
      setError('Please fill the collection details.');
      return;
    }

    readPassword()
      .then(async spendingPassword => {
        setLoading('Creating transaction...');
        createNftCollection(
          collection.name,
          JSON.stringify({ ...collection, amount: undefined, name: undefined }),
          collection.amount,
          spendingPassword,
        )
          .then(tx => {
            setLoading(false);
            bottomSheet.expand(
              <BottomSheetView>
                <TopNavigation title="Confirm collection creation" />
                <Layout level="2" style={styles.card}>
                  <View style={styles.row}>
                    <Text category="headline" style={{ marginRight: 16 }}>
                      Name:
                    </Text>
                    <Text
                      category="headline"
                      style={{ flex: 1, flexWrap: 'wrap' }}>
                      {collection.name}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text category="headline" style={{ marginRight: 16 }}>
                      Description:
                    </Text>
                    <Text
                      category="headline"
                      style={{ flex: 1, flexWrap: 'wrap' }}>
                      {collection.description}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text category="headline" style={{ marginRight: 16 }}>
                      Number of items:
                    </Text>
                    <Text
                      category="headline"
                      style={{ flex: 1, flexWrap: 'wrap' }}>
                      {collection.amount}
                    </Text>
                  </View>
                </Layout>

                <Layout level="2" style={{ ...styles.card, marginBottom: 24 }}>
                  <View style={styles.row}>
                    <Text category="headline" style={{ marginRight: 16 }}>
                      Fee:
                    </Text>
                    <Text category="headline">
                      {(tx.fee / 1e8).toFixed(8)}
                      {' xNAV'}
                    </Text>
                  </View>
                </Layout>

                <SwipeButton
                  goBackToStart={true}
                  onComplete={() => {
                    setLoading('Broadcasting...');
                    sendTransaction(tx.tx).then(res => {
                      if (res.error) {
                        bottomSheet.expand(
                          <BottomSheetView>
                            <Text center style={{ paddingBottom: 16 }}>
                              Unable to send transaction
                            </Text>
                            <Text center style={{ paddingBottom: 16 }}>
                              {res.error.split('[')[0]}
                            </Text>
                          </BottomSheetView>,
                        );
                        setLoading(false);
                      } else {
                        setLoading(false);
                        collapse();
                        goBack();
                      }
                    });
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
                <Text center style={{ paddingBottom: 16 }}>
                  Unable to create transaction
                </Text>
                <Text center style={{ paddingBottom: 16 }}>
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
            <Text center style={{ paddingBottom: 16 }}>
              Unable to create transaction
            </Text>
            <Text center style={{ paddingBottom: 16 }}>
              {e.message}
            </Text>
          </BottomSheetView>,
        );
      });
  };

  return (
    <Container useSafeArea>
      <KeyboardAwareScrollView>
        <TopNavigationComponent title={'Create a private NFT collection'} />

        <Layout level="2" style={styles.inputCard}>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Name:
            </Text>
            <Input
              autoFocus={true}
              style={[styles.inputField]}
              value={collection.name}
              onChangeText={value => {
                setCollectionProperty('name', value);
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Description:
            </Text>
            <Input
              style={[styles.inputField]}
              value={collection.description}
              onChangeText={value => {
                setCollectionProperty('description', value);
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Number of items:
            </Text>
            <Input
              style={[styles.inputField]}
              value={collection.amount?.toString()}
              keyboardType={'number-pad'}
              returnKeyType={'done'}
              placeholder={'0'}
              onChangeText={value => {
                setCollectionProperty('amount', parseInt(value || '0'));
              }}
            />
          </View>
          <Button status={'primary-whisper'} onPress={() => createCollection()}>
            Create
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
export default CreateNftCollectionScreen;
