import React, { useEffect, useState } from "react"
import { View, Text, Image, Animated, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { useSession } from "../hooks/useSession"

// In this version of anidex I decided to separate The intro screen to the main menu, this decision might stop at some point

export default function IntroScreen() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    if (loading) return

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate based on session
      if (session) {
        router.replace("/main")
      } else {
        router.replace("/signin")
      }
    })
  }, [fadeAnim, router, session, loading])

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
        <Text style={styles.title}>anidex</Text>
        <Image
          source={require("../assets/img/Celtic-Symbol-Deer.png")}
          style={styles.image}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
})
