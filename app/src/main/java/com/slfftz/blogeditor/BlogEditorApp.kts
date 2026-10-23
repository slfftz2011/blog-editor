package com.slfftz.blogeditor

import android.app.Application
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter

class BlogEditorApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val default = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            runCatching {
                val sw = StringWriter()
                e.printStackTrace(PrintWriter(sw))
                val dir = File(filesDir, "crash").apply { mkdirs() }
                File(dir, "last_crash.txt").writeText(
                    "Thread: ${t.name}\n\n${sw}"
                )
            }
            default?.uncaughtException(t, e)
        }
    }
}