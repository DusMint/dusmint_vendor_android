import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  version?: string;
  build?: string;
  cluster?: string;
}

export const VendorAppFooter: React.FC<Props> = ({
  version = '1.0.0',
  build = '42',
  cluster = 'Indore Mandi Cluster',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        DusMint Partner App v{version} ({build}) • {cluster}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
