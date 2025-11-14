// Safe shim for react-native-keep-awake to support bridgeless/new architecture.
// Falls back to react-native-incall-manager when NativeModules.KCKeepAwake is unavailable.
import { NativeModules } from 'react-native';
import InCallManager from 'react-native-incall-manager';

let mounted = 0;

export default class KeepAwake {
  static activate() {
    try {
      const mod = NativeModules?.KCKeepAwake;
      if (mod && typeof mod.activate === 'function') {
        mod.activate();
      } else {
        // Bridgeless or missing native module: keep screen on via InCallManager
        InCallManager.keepScreenOn(true);
      }
    } catch (e) {
      // No-op on failure to avoid crashing UI
    }
  }

  static deactivate() {
    try {
      const mod = NativeModules?.KCKeepAwake;
      if (mod && typeof mod.deactivate === 'function') {
        mod.deactivate();
      } else {
        InCallManager.keepScreenOn(false);
      }
    } catch (e) {
      // No-op
    }
  }

  componentDidMount() {
    mounted++;
    KeepAwake.activate();
  }

  componentWillUnmount() {
    mounted--;
    if (!mounted) {
      KeepAwake.deactivate();
    }
  }

  render() {
    return null;
  }
}