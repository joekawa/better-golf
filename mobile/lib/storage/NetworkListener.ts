import NetInfo from '@react-native-community/netinfo';

export class NetworkListener {
  private static listeners: ((isConnected: boolean) => void)[] = [];

  static initialize() {
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      this.notifyListeners(isConnected);
    });
  }

  static async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  static addListener(callback: (isConnected: boolean) => void) {
    this.listeners.push(callback);
  }

  static removeListener(callback: (isConnected: boolean) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private static notifyListeners(isConnected: boolean) {
    this.listeners.forEach(listener => listener(isConnected));
  }
}
