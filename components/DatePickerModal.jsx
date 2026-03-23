import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "../assets/styles/datePicker.styles";
import COLORS from "../constants/colors";

export default function DatePickerModal({ 
  visible, 
  onClose, 
  onSelect, 
  minimumDate = new Date(),
  maximumDate,
  initialDate = new Date()
}) {
  // Clamp initial date within min/max range
  const getClampedInitialDate = () => {
    let date = initialDate || new Date();
    if (date < minimumDate) date = minimumDate;
    if (maximumDate && date > maximumDate) date = maximumDate;
    return date;
  };
  const [selectedDate, setSelectedDate] = useState(getClampedInitialDate());
  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const minYear = minimumDate ? minimumDate.getFullYear() : currentYear;
  const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear + 9;
  const years = Array.from(
    { length: Math.max(1, maxYear - minYear + 1) },
    (_, i) => minYear + i
  );
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getSelectedYear = () => selectedDate.getFullYear();
  const getSelectedMonth = () => selectedDate.getMonth();
  const getSelectedDay = () => selectedDate.getDate();

  // Update selectedDate when initialDate changes
  useEffect(() => {
    let date = initialDate || new Date();
    if (date < minimumDate) date = minimumDate;
    if (maximumDate && date > maximumDate) date = maximumDate;
    setSelectedDate(date);
  }, [initialDate, minimumDate, maximumDate]);

  useEffect(() => {
    if (visible) {
      // Scroll to selected values after a short delay to ensure layout
      setTimeout(() => {
        const yearIndex = years.indexOf(getSelectedYear());
        const monthIndex = getSelectedMonth();
        const dayIndex = getSelectedDay() - 1;

        if (yearScrollRef.current && yearIndex >= 0) {
          yearScrollRef.current.scrollTo({ y: yearIndex * 48, animated: true });
        }
        if (monthScrollRef.current) {
          monthScrollRef.current.scrollTo({ y: monthIndex * 48, animated: true });
        }
        if (dayScrollRef.current) {
          dayScrollRef.current.scrollTo({ y: dayIndex * 48, animated: true });
        }
      }, 100);
    }
  }, [visible, selectedDate]);

  const clampToRange = (date) => {
    if (date < minimumDate) return minimumDate;
    if (maximumDate && date > maximumDate) return maximumDate;
    return date;
  };

  const handleYearChange = (year) => {
    const daysInNewMonth = getDaysInMonth(year, getSelectedMonth());
    const newDay = Math.min(getSelectedDay(), daysInNewMonth);
    const newDate = clampToRange(new Date(year, getSelectedMonth(), newDay));
    setSelectedDate(newDate);
  };

  const handleMonthChange = (monthIndex) => {
    const daysInNewMonth = getDaysInMonth(getSelectedYear(), monthIndex);
    const newDay = Math.min(getSelectedDay(), daysInNewMonth);
    const newDate = clampToRange(new Date(getSelectedYear(), monthIndex, newDay));
    setSelectedDate(newDate);
  };

  const handleDayChange = (day) => {
    const newDate = clampToRange(new Date(getSelectedYear(), getSelectedMonth(), day));
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    const finalDate = clampToRange(selectedDate);
    onSelect(finalDate);
  };

  const daysInMonth = getDaysInMonth(getSelectedYear(), getSelectedMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Year</Text>
              <ScrollView 
                ref={yearScrollRef}
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      getSelectedYear() === year && styles.pickerItemSelected,
                    ]}
                    onPress={() => handleYearChange(year)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        getSelectedYear() === year && styles.pickerItemTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Month</Text>
              <ScrollView 
                ref={monthScrollRef}
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerItem,
                      getSelectedMonth() === index && styles.pickerItemSelected,
                    ]}
                    onPress={() => handleMonthChange(index)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        getSelectedMonth() === index && styles.pickerItemTextSelected,
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Day</Text>
              <ScrollView 
                ref={dayScrollRef}
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      getSelectedDay() === day && styles.pickerItemSelected,
                    ]}
                    onPress={() => handleDayChange(day)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        getSelectedDay() === day && styles.pickerItemTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

