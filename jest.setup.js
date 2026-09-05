jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

jest.mock("react-native-webview", () => {
  const React = require("react");
  return React.forwardRef((props, ref) => React.createElement("WebView", { ...props, ref }));
});

jest.mock("react-native", () => {
  const React = require("react");
  const Component = (name) => {
    const comp = (props) => React.createElement(name, props, props.children);
    comp.displayName = name;
    return comp;
  };
  return {
    Platform: { OS: "ios", select: (objs) => (objs ? objs.ios : undefined), Version: 33 },
    StyleSheet: {
      create: (styles) => styles,
      absoluteFill: {},
    },
    View: Component("View"),
    Text: Component("Text"),
    TouchableOpacity: Component("TouchableOpacity"),
    ScrollView: Component("ScrollView"),
    ActivityIndicator: Component("ActivityIndicator"),
    Image: Component("Image"),
    TextInput: Component("TextInput"),
    FlatList: Component("FlatList"),
    KeyboardAvoidingView: Component("KeyboardAvoidingView"),
    Animated: {
      Value: jest.fn().mockImplementation(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(),
      })),
      timing: jest.fn().mockReturnValue({ start: jest.fn() }),
      spring: jest.fn().mockReturnValue({ start: jest.fn() }),
    },
    LayoutAnimation: {
      configureNext: jest.fn(),
      Presets: { easeInEaseOut: {} },
    },
    UIManager: {},
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
    },
    Clipboard: {
      setString: jest.fn(),
      getString: jest.fn().mockResolvedValue(""),
    },
    PermissionsAndroid: {
      PERMISSIONS: {
        RECORD_AUDIO: "android.permission.RECORD_AUDIO",
        ACCESS_FINE_LOCATION: "android.permission.ACCESS_FINE_LOCATION",
        ACCESS_COARSE_LOCATION: "android.permission.ACCESS_COARSE_LOCATION",
        POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
      },
      check: jest.fn().mockResolvedValue(true),
      request: jest.fn().mockResolvedValue("granted"),
    },
    AppState: {
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
  };
});
