package com.slfftz.blogeditor.data

import com.slfftz.blogeditor.model.RepoConfig
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider
import java.io.File

class GitService {

    private fun creds(config: RepoConfig, token: String) =
        UsernamePasswordCredentialsProvider(config.username, token)

    fun clone(config: RepoConfig, token: String): Result<Unit> = runCatching {
        val dest = File(config.localPath)
        if (dest.exists() && dest.list()?.isNotEmpty() == true) {
            throw IllegalStateException("本地目录已存在且非空：${dest.absolutePath}")
        }
        Git.cloneRepository()
            .setURI(config.remoteUrl)
            .setBranch(config.branch)
            .setDirectory(dest)
            .setCredentialsProvider(creds(config, token))
            .call()
            .close()
    }

    fun commitAndPush(config: RepoConfig, token: String, message: String): Result<String> = runCatching {
        val repoDir = File(config.localPath)
        Git.open(repoDir).use { git ->
            git.add().addFilepattern(".").call()
            git.add().setUpdate(true).addFilepattern(".").call()
            val status = git.status().call()
            if (status.isClean) return@use "无变更可提交"
            val commit = git.commit().setMessage(message).call()
            git.push()
                .setRemote("origin")
                .setCredentialsProvider(creds(config, token))
                .call()
            "已推送 ${commit.shortMessage}"
        }
    }
}