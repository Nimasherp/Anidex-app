import React, { useState, useEffect } from "react"
import { View, Text, Image, Button, TouchableOpacity, StyleSheet, ActivityIndicator, Alert} from "react-native" // for UI
import { SafeAreaView } from "react-native-safe-area-context" // in order to not cover the hot bar of the phone
import * as ImagePicker from "expo-image-picker" 
import { supabase } from "../lib/supabase" // what will link us to our database and handles authentifications
import { useSession } from "../hooks/useSession"
import * as FileSystem from "expo-file-system"

export default function MainComponent() {
  const { session, loading: sessionLoading, signOut } = useSession()
  const user = session?.user || null

  if(!user) {
    throw new Error("User not signed in !")
  }

  const [file, setFile] = useState(null) 
  const [image, setImage] = useState(null)
  const [collection, setCollection] = useState([])
  const [identifiedAnimal, setIdentifiedAnimal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)


  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 1,
      })
  
      if (!result.cancelled) {
        const selectedUri = result.assets[0].uri
        setFile(selectedUri)
        await uploadImage(selectedUri)
      }
    } catch (err) {
      console.error("Pick image error:", err)
      setError(err.message)
    }
  } 
  
  const uploadImage = async (uri) => {
    setLoading(true)
    try {
      if (!uri) throw new Error("No URI provided") 
  
      const filename = uri.split("/").pop()// get the file name
      const filepath = `${user.id}/${filename}`
      const fileContents = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      }) 
      const file = Uint8Array.from(atob(fileContents), c => c.charCodeAt(0)) 
      
      // Upload to public bucket which is called "ImageCollections"
      const { data, error } = await supabase.storage
        .from("ImageCollections")
        .upload(`public/${filepath}`, file, { upsert: true }) 
      
      if (error) throw error 
  
      // Get public URL
      const { data: publicData } = supabase.storage
        .from("ImageCollections")
        .getPublicUrl(`public/${filepath}`) 
      
      setImage(publicData.publicUrl)
      identifyAnimal(publicData.publicUrl)
    } catch (err) {
      console.error("Upload error:", err.message) 
      throw err 
    } finally {
      setLoading(false)
    }
  } 

  const identifyAnimal = async (imageUrl) => {
    
    try {
      // identify-animal is an edge function from supabase
      const { data, error } = await supabase.functions.invoke("identify-animal", {
        body: { imageUrl },
      })
      if (error) throw error
      setIdentifiedAnimal(data)
    } catch (err) {
      console.error("Identify error:", err.message)
      setError("Failed to identify animal")
    }
  }



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#DBEAFE"}}>
        <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
            <Text style={styles.title}>anidex</Text>
            <View style={styles.topRight}>
            <Text style={styles.collectionText}>My Collection ({collection.length})</Text>
            <Button title="Sign Out" onPress={signOut} />
            </View>
        </View>

        {/* Main */}
        {!image ? (
            <View style={styles.uploadContainer}>
            <Text style={styles.heading}>Capture Wildlife</Text>
            <Text style={styles.subheading}>Upload a photo to identify and collect animals</Text>

            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />

            {identifiedAnimal && (
                <View style={styles.animalCard}>
                <Text style={styles.animalName}>{identifiedAnimal.identification}</Text>
                {identifiedAnimal.found && (
                    <TouchableOpacity style={styles.captureButton} > 
                    <Text style={styles.captureButtonText}>Add to Collection</Text>
                    </TouchableOpacity>
                )}
                </View>
            )}

            <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                setImage(null) 
                setFile(null) 
                setIdentifiedAnimal(null) 
                }}
            >
                <Text style={styles.resetButtonText}>Upload Another Photo</Text>
            </TouchableOpacity>
            </View>
        
        )}

        {error && (
            <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            </View>
        )}

        {loading && <ActivityIndicator size="large" color="#0288D1" />}
        </View>
    </SafeAreaView>
  ) 
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DBEAFE" },
  topBar: { flexDirection: "row", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  title: { fontSize: 24, fontWeight: "bold" },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  collectionText: { fontSize: 16, color: "#4B5563" },
  uploadContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  heading: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subheading: { fontSize: 16, color: "#6B7280", marginBottom: 24, textAlign: "center" },
  uploadButton: { backgroundColor: "#2563EB", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20 },
  uploadButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  imageContainer: { flex: 1, alignItems: "center", padding: 16 },
  image: { width: "100%", height: 300, borderRadius: 20, marginBottom: 16 },
  animalCard: { backgroundColor: "white", padding: 16, borderRadius: 20, width: "100%", marginBottom: 16, alignItems: "center" },
  animalName: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  captureButton: { backgroundColor: "#10B981", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16 },
  captureButtonText: { color: "white", fontWeight: "bold" },
  resetButton: { backgroundColor: "#6B7280", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16 },
  resetButtonText: { color: "white", fontWeight: "bold" },
  errorContainer: { marginTop: 16, padding: 12, borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 16, backgroundColor: "#FEE2E2" },
  errorText: { color: "#B91C1C", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
}) 