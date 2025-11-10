import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

// Global navigation ref to allow root-level resets from anywhere
export const navigationRef = createNavigationContainerRef();

export const resetToMain = () => {
  try {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
      );
    } else {
      // If not ready yet, retry shortly
      setTimeout(() => {
        if (navigationRef.isReady()) {
          navigationRef.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
          );
        }
      }, 200);
    }
  } catch (e) {
    console.log('Root reset error:', e?.message || e);
  }
};