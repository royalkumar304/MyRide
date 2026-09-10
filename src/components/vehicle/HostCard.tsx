import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../common/Badge';

export interface HostCardProps {
  hostName: string;
  rating: number;
  trips: number;
  isVerified?: boolean;
  responseRate?: number;
  onChatPress?: () => void;
  onCallPress?: () => void;
}

export const HostCard: React.FC<HostCardProps> = ({
  hostName,
  rating,
  trips,
  isVerified = true,
  responseRate = 98,
  onChatPress,
  onCallPress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{hostName.charAt(0)}</Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{hostName}</Text>
            {isVerified ? (
              <Badge
                label="Verified"
                variant="success"
                size="sm"
                style={{ marginLeft: 6 }}
              />
            ) : null}
          </View>
          <Text style={styles.subtext}>
            ⭐ {rating.toFixed(1)} • {trips} Trips Completed • {responseRate}% Response
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {onChatPress ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onChatPress}
            style={[styles.actionButton, styles.chatButton]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={styles.chatButtonText}>Chat with Host</Text>
          </TouchableOpacity>
        ) : null}

        {onCallPress ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCallPress}
            style={[styles.actionButton, styles.callButton]}
          >
            <Ionicons name="call-outline" size={16} color={colors.dark} />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  subtext: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    flex: 1,
  },
  chatButton: {
    backgroundColor: colors.primaryLight,
    marginRight: 6,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  callButton: {
    backgroundColor: colors.surfaceVariant,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginLeft: 6,
  },
});

export default HostCard;
