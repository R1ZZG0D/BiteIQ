import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Barcode, Camera, ImagePlus, Send } from "lucide-react-native";
import { api } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { colors } from "../theme/colors";
import type { Scan } from "../types";

type Props = {
  onScanComplete: (scan: Scan) => Promise<void>;
};

const sampleText =
  "Ingredients: whole grain oats, sugar, whey powder, soy lecithin, natural flavors. Nutrition Facts: sugars 12g, protein 7g.";

export function CameraScreen({ onScanComplete }: Props) {
  const CameraPreview = CameraView as unknown as any;
  const cameraRef = useRef<{ takePictureAsync: (options?: { quality?: number }) => Promise<{ uri: string }> } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [productName, setProductName] = useState("");
  const [rawText, setRawText] = useState("");
  const [sugarGrams, setSugarGrams] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState<"camera" | "image" | "text" | "barcode" | null>(null);
  const [error, setError] = useState("");

  async function completeScan(promise: Promise<Scan>, mode: typeof loading) {
    setLoading(mode);
    setError("");
    try {
      const scan = await promise;
      await onScanComplete(scan);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setLoading(null);
    }
  }

  async function captureImage() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.75 });
    if (!photo?.uri) return;
    await completeScan(
      api.scanImage({
        uri: photo.uri,
        productName: productName || undefined,
        sugarGrams: parseOptionalNumber(sugarGrams),
        proteinGrams: parseOptionalNumber(proteinGrams)
      }),
      "camera"
    );
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]?.uri) return;
    await completeScan(
      api.scanImage({
        uri: result.assets[0].uri,
        productName: productName || undefined,
        sugarGrams: parseOptionalNumber(sugarGrams),
        proteinGrams: parseOptionalNumber(proteinGrams)
      }),
      "image"
    );
  }

  async function analyzeText() {
    if (rawText.trim().length < 3) {
      setError("Add ingredient text before analyzing.");
      return;
    }
    await completeScan(
      api.scanText({
        productName: productName || undefined,
        rawText,
        sugarGrams: parseOptionalNumber(sugarGrams),
        proteinGrams: parseOptionalNumber(proteinGrams)
      }),
      "text"
    );
  }

  async function analyzeBarcode() {
    if (barcode.trim().length < 6) {
      setError("Enter a valid barcode.");
      return;
    }
    await completeScan(api.scanBarcode(barcode), "barcode");
  }

  function fillSample() {
    setProductName("Oat protein bar");
    setRawText(sampleText);
    setSugarGrams("12");
    setProteinGrams("7");
  }

  const cameraReady = permission?.granted;

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Scan label</Text>
          <Text style={styles.subtitle}>Camera OCR, image upload, barcode lookup, or text scan.</Text>
        </View>

        <View style={styles.cameraShell}>
          {cameraReady ? (
            <CameraPreview ref={cameraRef} style={styles.camera} facing="back">
              <View style={styles.overlay}>
                <View style={styles.guide} />
              </View>
            </CameraPreview>
          ) : (
            <View style={styles.permissionBox}>
              <Camera color={colors.green} size={34} />
              <Text style={styles.permissionText}>Camera access</Text>
              <ActionButton
                label="Enable"
                onPress={requestPermission}
                variant="secondary"
                icon={<Camera color={colors.ink} size={18} />}
              />
            </View>
          )}
        </View>

        <View style={styles.actionGrid}>
          <ActionButton
            label="Capture"
            onPress={captureImage}
            disabled={!cameraReady}
            loading={loading === "camera"}
            icon={<Camera color="#FFFFFF" size={20} />}
          />
          <ActionButton
            label="Upload"
            onPress={pickImage}
            variant="secondary"
            loading={loading === "image"}
            icon={<ImagePlus color={colors.ink} size={20} />}
          />
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Product name"
            placeholderTextColor={colors.muted}
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
          />
          <View style={styles.numberRow}>
            <TextInput
              placeholder="Sugar g"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={sugarGrams}
              onChangeText={setSugarGrams}
              style={[styles.input, styles.numberInput]}
            />
            <TextInput
              placeholder="Protein g"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={proteinGrams}
              onChangeText={setProteinGrams}
              style={[styles.input, styles.numberInput]}
            />
          </View>
          <TextInput
            placeholder="OCR text"
            placeholderTextColor={colors.muted}
            value={rawText}
            onChangeText={setRawText}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
          <View style={styles.actionGrid}>
            <ActionButton
              label="Analyze"
              onPress={analyzeText}
              loading={loading === "text"}
              icon={<Send color="#FFFFFF" size={18} />}
            />
            <ActionButton label="Sample" onPress={fillSample} variant="secondary" />
          </View>
        </View>

        <View style={styles.barcodeRow}>
          <TextInput
            placeholder="Barcode"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={barcode}
            onChangeText={setBarcode}
            style={[styles.input, styles.barcodeInput]}
          />
          <ActionButton
            label="Lookup"
            onPress={analyzeBarcode}
            variant="secondary"
            loading={loading === "barcode"}
            icon={<Barcode color={colors.ink} size={18} />}
          />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.green} />
            <Text style={styles.loadingText}>Analyzing label...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    gap: 18
  },
  header: {
    gap: 6
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  cameraShell: {
    height: 270,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.charcoal
  },
  camera: {
    flex: 1
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  guide: {
    height: 142,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.surface
  },
  permissionText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10
  },
  form: {
    gap: 10
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  numberRow: {
    flexDirection: "row",
    gap: 10
  },
  numberInput: {
    flex: 1
  },
  textArea: {
    minHeight: 118,
    paddingTop: 12,
    lineHeight: 20
  },
  barcodeRow: {
    flexDirection: "row",
    gap: 10
  },
  barcodeInput: {
    flex: 1
  },
  loadingBox: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.greenSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    color: colors.green,
    fontWeight: "900"
  },
  errorBox: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.redSoft
  },
  errorText: {
    color: colors.red,
    fontWeight: "800"
  }
});
