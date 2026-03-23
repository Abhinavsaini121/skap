import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../assets/styles/countryPicker.styles";
import COLORS from "../constants/colors";

export default function CountryPickerModal({
  visible,
  onClose,
  onSelect,
  selectedCountry = null,
}) {
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.8;

  // Fetch countries from REST Countries API
  useEffect(() => {
    if (visible) {
      fetchCountries();
    }
  }, [visible]);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = countries.filter(
        (country) =>
          country.name.common.toLowerCase().includes(query) ||
          country.name.official.toLowerCase().includes(query) ||
          country.cca2.toLowerCase().includes(query) ||
          country.cca3.toLowerCase().includes(query)
      );
      setFilteredCountries(filtered);
    }
  }, [searchQuery, countries]);

  const fetchCountries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,cca3,flags");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }
      
      // Sort countries alphabetically by name
      const sorted = data.sort((a, b) =>
        a.name.common.localeCompare(b.name.common)
      );
      
      setCountries(sorted);
      setFilteredCountries(sorted);
    } catch (error) {
      console.error("Error fetching countries:", error);
      Alert.alert("Error", `Failed to load countries: ${error.message}`);
      setCountries([]);
      setFilteredCountries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (country) => {
    onSelect({
      name: country.name.common,
      code: country.cca2,
      flag: country.flags.png,
    });
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { height: modalHeight }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              placeholderTextColor={COLORS.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Countries List */}
          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading countries...</Text>
              </View>
            ) : filteredCountries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="globe-outline"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {countries.length === 0 ? "Failed to load countries" : "No countries found"}
                </Text>
                {countries.length === 0 && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchCountries}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ScrollView
                style={styles.countriesList}
                contentContainerStyle={styles.countriesListContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {filteredCountries.map((country) => {
                    const isSelected =
                      selectedCountry?.code === country.cca2 ||
                      selectedCountry?.name === country.name.common;
                    return (
                      <TouchableOpacity
                        key={country.cca2}
                        style={[
                          styles.countryItem,
                          isSelected && styles.countryItemSelected,
                        ]}
                        onPress={() => handleSelect(country)}
                      >
                        <Image
                          source={{ uri: country.flags.png }}
                          style={styles.flagImage}
                          contentFit="contain"
                        />
                        <View style={styles.countryInfo}>
                          <Text
                            style={[
                              styles.countryName,
                              isSelected && styles.countryNameSelected,
                            ]}
                          >
                            {country.name.common}
                          </Text>
                          <Text style={styles.countryCode}>
                            {country.cca2} • {country.cca3}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={COLORS.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                }
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

