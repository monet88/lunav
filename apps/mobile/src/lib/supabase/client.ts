import type { PublicSupabaseConfig } from '@lunav/config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createClient,
  processLock,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js'
import * as aesjs from 'aes-js'
import * as SecureStore from 'expo-secure-store'
import 'react-native-get-random-values'

type CreateClient<TClient> = (
  url: string,
  publishableKey: string,
  options: SupabaseClientOptions<'public'>
) => TClient

interface MobileSupabaseClientDependencies<TClient> {
  createClient: CreateClient<TClient>
}

class LargeSecureStore {
  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8))
    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1)
    )
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value))

    await SecureStore.setItemAsync(
      key,
      aesjs.utils.hex.fromBytes(encryptionKey)
    )

    return aesjs.utils.hex.fromBytes(encryptedBytes)
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key)

    if (encryptionKeyHex === null) {
      return null
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    )
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value))

    return aesjs.utils.utf8.fromBytes(decryptedBytes)
  }

  async getItem(key: string): Promise<string | null> {
    const encryptedValue = await AsyncStorage.getItem(key)

    if (encryptedValue === null) {
      return null
    }

    return this.decrypt(key, encryptedValue)
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
    await SecureStore.deleteItemAsync(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptedValue = await this.encrypt(key, value)

    await AsyncStorage.setItem(key, encryptedValue)
  }
}

const mobileAuthOptions: SupabaseClientOptions<'public'> = {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
    persistSession: true,
    storage: new LargeSecureStore(),
  },
}

export function createMobileSupabaseClient(
  config: PublicSupabaseConfig
): SupabaseClient
export function createMobileSupabaseClient<TClient>(
  config: PublicSupabaseConfig,
  dependencies: MobileSupabaseClientDependencies<TClient>
): TClient
export function createMobileSupabaseClient<TClient>(
  config: PublicSupabaseConfig,
  dependencies: MobileSupabaseClientDependencies<TClient> = {
    createClient: createClient as CreateClient<TClient>,
  }
): TClient {
  return dependencies.createClient(
    config.url,
    config.publishableKey,
    mobileAuthOptions
  )
}
