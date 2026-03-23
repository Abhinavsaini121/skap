import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Alert, TextInput, Image, ImageBackground, ScrollView 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

// Dummy Data
const DUMMY_SONGS = [
  {
    id: '1',
    title: 'Lo-Fi Chill Beats',
    banner: 'https://images.unsplash.com/photo-1459749411177-042180ceea72?q=80&w=400&auto=format&fit=crop',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Midnight Jazz',
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
];

export default function UploadAudioScreen() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'upload'
  const [audioList, setAudioList] = useState(DUMMY_SONGS);
  const [uploading, setUploading] = useState(false);
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  // Form States
  const [title, setTitle] = useState('');
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // --- Functions ---

  const pickBanner = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedBanner(result.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setSelectedAudio(result.assets[0]);
    }
  };

  const handleUpload = () => {
    if (!title || !selectedAudio || !selectedBanner) {
      Alert.alert("Error", "Please fill all fields and select files!");
      return;
    }

    setUploading(true);
    // Simulating API call
    setTimeout(() => {
      const newSong = {
        id: Date.now().toString(),
        title: title,
        banner: selectedBanner,
        uri: selectedAudio.uri,
      };
      setAudioList([newSong, ...audioList]);
      setUploading(false);
      Alert.alert("Success", "Song uploaded successfully!");
      // Reset form and go to list
      setTitle('');
      setSelectedAudio(null);
      setSelectedBanner(null);
      setActiveTab('list');
    }, 2000);
  };

  const playPauseAudio = async (item) => {
    if (playingId === item.id) {
      await sound.pauseAsync();
      setPlayingId(null);
    } else {
      if (sound) { await sound.unloadAsync(); }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(item.id);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setPlayingId(null);
      });
    }
  };

  // --- UI Components ---

  const renderSongItem = ({ item }) => (
    <ImageBackground source={{ uri: item.banner }} style={styles.songCard} imageStyle={{ borderRadius: 15 }}>
      <View style={styles.overlay}>
        <View style={styles.songDetails}>
          <Text style={styles.songTitleCard}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={() => playPauseAudio(item)}>
          <Ionicons 
            name={playingId === item.id ? "pause-circle" : "play-circle"} 
            size={50} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'list' && styles.activeTab]} 
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>All Songs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'upload' && styles.activeTab]} 
          onPress={() => setActiveTab('upload')}
        >
          <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>Upload Song</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <FlatList
          data={audioList}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No songs found.</Text>}
        />
      ) : (
        <ScrollView style={styles.uploadForm}>
          <Text style={styles.label}>Song Title</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter song title..." 
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Song Banner</Text>
          <TouchableOpacity style={styles.mediaPicker} onPress={pickBanner}>
            {selectedBanner ? (
              <Image source={{ uri: selectedBanner }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="image-outline" size={30} color={COLORS.primary} />
                <Text style={styles.pickerText}>Select Banner Image</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Audio File</Text>
          <TouchableOpacity style={styles.mediaPicker} onPress={pickAudio}>
            <Ionicons name="musical-note-outline" size={30} color={COLORS.primary} />
            <Text style={styles.pickerText}>
              {selectedAudio ? selectedAudio.name : "Select Audio File"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Upload Now</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fefefe', paddingTop: 50 },
  
  // Tabs
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 25, padding: 5 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
  activeTab: { backgroundColor: COLORS.primary || '#6200EE' },
  tabText: { fontWeight: 'bold', color: '#888' },
  activeTabText: { color: '#fff' },

  // List View
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  songCard: { height: 120, marginBottom: 15, overflow: 'hidden', elevation: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderRadius: 15 },
  songDetails: { flex: 1 },
  songTitleCard: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Upload Form
  uploadForm: { paddingHorizontal: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333', marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  mediaPicker: { borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 10, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', marginTop: 5, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerText: { marginTop: 5, color: COLORS.primary || '#6200EE', fontSize: 14 },
  submitButton: { backgroundColor: COLORS.primary || '#6200EE', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});