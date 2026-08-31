import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { CHATTY_EMOJI_CATEGORIES, CHATTY_EMOJI_DATA, ChattyEmojiEntry } from "./chattyEmojiData";

const CATEGORY_GLYPH: Record<string, string> = {
  "Smileys & Emotion": "😀",
  "People & Body": "🙌",
  "Animals & Nature": "🐾",
  "Food & Drink": "🍔",
  "Travel & Places": "✈️",
  "Activities": "🎮",
  "Objects": "💡",
  "Symbols": "🔣",
  "Flags": "🏳️",
};

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
export function ChattyEmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(CHATTY_EMOJI_CATEGORIES[0]);
  const isSearching = query.trim().length > 0;

  const visible = useMemo(() => {
    if (isSearching) {
      const q = query.trim().toLowerCase();
      return CHATTY_EMOJI_DATA.filter(
        (e) => e.name.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return CHATTY_EMOJI_DATA.filter((e) => e.category === category);
  }, [query, category, isSearching]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search emoji…"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {!isSearching && (
        <View style={styles.categoryRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CHATTY_EMOJI_CATEGORIES}
            keyExtractor={(c) => c}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setCategory(item)}
                style={[styles.categoryTab, item === category && styles.categoryTabActive]}
              >
                <Text style={{ fontSize: 15 }}>{CATEGORY_GLYPH[item] ?? "•"}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          />
        </View>
      )}

      <FlatList
        key="emoji-grid-8col"
        data={visible}
        keyExtractor={(e: ChattyEmojiEntry, i) => `${e.emoji}-${i}`}
        numColumns={8}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cell} onPress={() => onPick(item.emoji)}>
            <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
          </TouchableOpacity>
        )}
        style={styles.grid}
        contentContainerStyle={{ padding: 4 }}
        initialNumToRender={64}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#f7f7f8",
  },
  searchIcon: { fontSize: 12 },
  searchInput: { flex: 1, fontSize: 12, color: "#1f2937", padding: 0 },
  categoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f1",
    paddingVertical: 4,
  },
  categoryTab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  categoryTabActive: { backgroundColor: "#eef0f2" },
  grid: { flex: 1 },
  cell: {
    width: "12.5%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
