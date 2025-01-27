import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  IndexPath,
  Input,
  Layout,
  Select,
  SelectItem,
} from '@tsejerome/ui-kitten-components';
import { Container, Text, TopNavigationComponent } from '@components';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ServerOption, protosOptions } from '@constants';
import { RootStackParamList, ScreenProps } from '@navigation/type';
import { validateIp, validatePort } from '@utils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useWallet } from '@hooks';
import { addServerScreenStyles as styles } from './styles';

const AddServerScreen = (props: ScreenProps<'AddServerScreen'>) => {
  const { network } = useWallet();

  const { navigate } = useNavigation<NavigationProp<RootStackParamList>>();
  const [error, setError] = useState('');

  const [newServer, setNewServer] = useState<ServerOption>({
    type: network,
    proto: protosOptions[0],
  });

  const findMatchedIdx = () => {
    if (newServer.proto) {
      const matchedIdx = protosOptions.findIndex(
        proto => proto === newServer.proto,
      );
      if (matchedIdx > 0) {
        return new IndexPath(matchedIdx);
      }
    }
    return new IndexPath(0);
  };

  const setNewServerProperty = (
    type: keyof ServerOption,
    value: string | number,
  ) => {
    const temp = { ...newServer };
    temp[type] = value as any;
    setNewServer(temp);
  };
  const addServer = () => {
    if (
      !newServer?.host ||
      !newServer?.port ||
      !newServer?.proto ||
      !newServer?.type
    ) {
      setError('Please input server details.');
      return;
    }
    if (newServer.host && !validateIp(newServer.host)) {
      setError('Invalid server');
      return;
    }
    if (newServer.port && !validatePort(newServer.port)) {
      setError('Invalid port');
      return;
    }
    props.route.params.params.addServer(newServer, () => {
      props.navigation.goBack();
    });
  };

  useEffect(() => {}, []);

  return (
    <Container useSafeArea>
      <KeyboardAwareScrollView>
        <TopNavigationComponent title={'Add New Server'} />

        <Layout level="2" style={styles.inputCard}>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Host:
            </Text>
            <Input
              autoFocus={true}
              style={[styles.inputField]}
              value={newServer.host}
              onChangeText={value => {
                setNewServerProperty('host', value);
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Port:
            </Text>
            <Input
              style={[styles.inputField]}
              value={newServer.port?.toString()}
              onChangeText={value => {
                setNewServerProperty('port', Number.parseInt(value));
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Proto:
            </Text>
            <Select
              style={[styles.inputField]}
              selectedIndex={findMatchedIdx()}
              value={protosOptions[findMatchedIdx().row]}
              onSelect={index => {
                const i = index as IndexPath;
                if (i) {
                  setNewServerProperty('proto', protosOptions[i.row]);
                }
              }}>
              {protosOptions.map(proto => {
                return <SelectItem title={proto} />;
              })}
            </Select>
          </View>
          <View style={styles.inputGroup}>
            <Text category="headline" style={[styles.inputTitle]}>
              Network:
            </Text>
            <Text category="headline">{network}</Text>
          </View>
          <Button status={'primary-whisper'} onPress={() => addServer()}>
            Add
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

export default AddServerScreen;
