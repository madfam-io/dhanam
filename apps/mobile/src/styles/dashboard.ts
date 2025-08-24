import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontWeight: '700',
    color: '#212121',
  },
  spaceTitle: {
    color: '#757575',
    marginTop: 4,
  },
  netWorthCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  netWorthLabel: {
    color: '#757575',
    marginBottom: 4,
  },
  netWorthValue: {
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  netWorthChange: {
    color: '#4CAF50',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 16,
    color: '#212121',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#212121',
  },
  transactionsCard: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#212121',
  },
  emptyStateMessage: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 24,
  },
  emptyStateAction: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
