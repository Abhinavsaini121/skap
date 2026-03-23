import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  pickerContainer: {
    flexDirection: "row",
    padding: 20,
    height: 300,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary + "20",
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default styles;

