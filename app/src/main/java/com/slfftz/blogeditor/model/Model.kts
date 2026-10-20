package com.slfftz.blogeditor.model

data class RepoConfig(
    val remoteUrl: String,
    val username: String,
    val branch: String = "dev",
    val localPath: String,
    val imageDir: String = "source/images",
    val imageUrlPrefix: String = "/images",
)

data class FileItem(val relativePath: String, val name: String)

enum class EditorMode { EDIT, PREVIEW, SPLIT }

sealed interface GitOperationState {
    data object Idle : GitOperationState
    data object Running : GitOperationState
    data class Success(val message: String) : GitOperationState
    data class Error(val message: String) : GitOperationState
}