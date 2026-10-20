package com.slfftz.blogeditor.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.slfftz.blogeditor.model.RepoConfig

class RepoConfigStore(context: Context) {
    private val prefs: SharedPreferences = run {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "repo_config",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun save(config: RepoConfig, token: String) {
        prefs.edit()
            .putString("remoteUrl", config.remoteUrl)
            .putString("username", config.username)
            .putString("branch", config.branch)
            .putString("localPath", config.localPath)
            .putString("imageDir", config.imageDir)
            .putString("imageUrlPrefix", config.imageUrlPrefix)
            .putString("token", token)
            .apply()
    }

    fun loadConfig(): RepoConfig? {
        val url = prefs.getString("remoteUrl", null) ?: return null
        return RepoConfig(
            remoteUrl = url,
            username = prefs.getString("username", "")!!,
            branch = prefs.getString("branch", "dev")!!,
            localPath = prefs.getString("localPath", "")!!,
            imageDir = prefs.getString("imageDir", "source/images")!!,
            imageUrlPrefix = prefs.getString("imageUrlPrefix", "/images")!!,
        )
    }

    fun loadToken(): String? = prefs.getString("token", null)
    fun clear() = prefs.edit().clear().apply()
}