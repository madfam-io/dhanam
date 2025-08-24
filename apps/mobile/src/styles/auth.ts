import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    lineHeight: 24,
  },
  features: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureCard: {
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#212121',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#757575',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 40,
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    borderColor: '#4CAF50',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    textAlign: 'center',
    color: '#9E9E9E',
    lineHeight: 20,
  },
  // Login/Register form styles
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formTitle: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  formSubtitle: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#F44336',
    marginTop: 4,
    marginLeft: 12,
  },
  helperText: {
    color: '#757575',
    marginTop: 4,
    marginLeft: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricButton: {
    marginTop: 12,
    borderColor: '#2196F3',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  dividerText: {
    color: '#757575',
    marginRight: 8,
  },
});
