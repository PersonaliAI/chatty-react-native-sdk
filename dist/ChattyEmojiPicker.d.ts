import React from "react";
/**
 * Search field + category tabs + scrollable grid over the full generated
 * emoji dataset (chattyEmojiData.ts) — the "real emoji library" experience
 * (matching the web widget's emoji-picker-react and the Android SDK's
 * androidx.emoji2 EmojiPickerView), not the old fixed ~60-emoji grid.
 *
 * A FlatList (not a plain mapped View) backs the grid since the full/
 * unfiltered category can be a few hundred entries — FlatList only mounts
 * what's on/near screen instead of ~1,850 TouchableOpacity instances at once.
 * The dataset itself is a compiled-in constant, so there's nothing to fetch —
 * this renders synchronously the moment its parent shows it.
 */
export declare function ChattyEmojiPicker({ onPick }: {
    onPick: (emoji: string) => void;
}): React.JSX.Element;
