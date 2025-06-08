export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

interface TelegramWebApp {
    [x: string]: string;
    initData: string;
    initDataUnsafe: {
      query_id?: string;
      user?: TgUser;
      auth_date?: number;
      hash?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
      link_color?: string;
      button_color?: string;
      button_text_color?: string;
      secondary_bg_color?: string;
      hint_color?: string;
      bg_color?: string;
      text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    BackButton: {
      isVisible: boolean;
      onClick: (callback: () => void) => void;
      show: () => void;
      hide: () => void;
    };
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isProgressVisible: boolean;
      isActive: boolean;
      setText: (text: string) => void;
      onClick: (callback: () => void) => void;
      show: () => void;
      hide: () => void;
      enable: () => void;
      disable: () => void;
      showProgress: (leaveActive?: boolean) => void;
      hideProgress: () => void;
      setParams: (params: {
        text?: string;
        color?: string;
        text_color?: string;
        is_active?: boolean;
        is_visible?: boolean;
      }) => void;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    sendData: (data: string) => void;
    openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink: (url: string) => void;
    showPopup: (params: {
      title?: string;
      message: string;
      buttons?: Array<{
        id?: string;
        type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text?: string;
      }>;
    }, callback?: (buttonId: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    showScanQrPopup: (params: {
      text?: string;
    }, callback?: (data: string) => void) => boolean;
    closeScanQrPopup: () => void;
    readTextFromClipboard: (callback?: (data: string) => void) => void;
    requestWriteAccess: (callback?: (granted: boolean) => void) => void;
    requestContact: (callback?: (granted: boolean) => void) => void;
  }
  
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }