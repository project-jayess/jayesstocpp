export function getStreamRuntimeHeaderFragment() {
  return `enum class stream_mode {
  read,
  write
};

struct stream_state {
  stream_mode mode;
  bool closed = false;
  std::unique_ptr<std::ifstream> input;
  std::unique_ptr<std::ofstream> output;
};

value stream_open_read_async(const std::string& pathText);
value stream_open_write_async(const std::string& pathText);
value stream_open_read(const std::string& pathText);
value stream_open_write(const std::string& pathText);
value stream_read_chunk_async(const value& stream, int size);
value stream_write_chunk_async(const value& stream, const value& bytes);
value stream_close_async(const value& stream);
bool is_stream_value(const value& input);`;
}

export function getStreamRuntimeCppFragment() {
  return `namespace {
stream_ptr require_stream_value(const value& input) {
  if (!std::holds_alternative<stream_ptr>(input)) {
    throw_invalid_handle("stream", "stream");
  }
  return std::get<stream_ptr>(input);
}

bytes_ptr require_stream_bytes(const value& input) {
  if (!std::holds_alternative<bytes_ptr>(input)) {
    throw std::runtime_error("Jayess stream writeChunk expects bytes");
  }
  return std::get<bytes_ptr>(input);
}

value stream_async_result(std::function<value()> operation) {
  const auto result = make_pending_async();
  async_schedule([result, operation = std::move(operation)]() mutable {
    try {
      async_resolve(result, operation());
    } catch (const thrown_value& error) {
      async_reject(result, exception_to_value(error));
    } catch (const std::exception& error) {
      async_reject(result, exception_to_value(error));
    }
  });
  return result;
}

void require_stream_open(const stream_ptr& stream) {
  if (stream->closed) {
    throw_closed_handle("stream", "stream");
  }
}
} // namespace

bool is_stream_value(const value& input) {
  return std::holds_alternative<stream_ptr>(input);
}

value stream_open_read_async(const std::string& pathText) {
  return stream_async_result([pathText]() -> value {
    return stream_open_read(pathText);
  });
}

value stream_open_write_async(const std::string& pathText) {
  return stream_async_result([pathText]() -> value {
    return stream_open_write(pathText);
  });
}

value stream_open_read(const std::string& pathText) {
  auto stream = std::make_shared<stream_state>();
  stream->mode = stream_mode::read;
  stream->input = std::make_unique<std::ifstream>(std::filesystem::path(pathText), std::ios::binary);
  if (!*stream->input) {
    throw std::runtime_error("Unable to open read stream");
  }
  return stream;
}

value stream_open_write(const std::string& pathText) {
  auto stream = std::make_shared<stream_state>();
  stream->mode = stream_mode::write;
  stream->output = std::make_unique<std::ofstream>(std::filesystem::path(pathText), std::ios::binary);
  if (!*stream->output) {
    throw std::runtime_error("Unable to open write stream");
  }
  return stream;
}

value stream_read_chunk_async(const value& input, int size) {
  return stream_async_result([input, size]() -> value {
    const auto stream = require_stream_value(input);
    require_stream_open(stream);
    if (stream->mode != stream_mode::read || !stream->input) {
      throw_wrong_direction("stream", "readChunk", "read");
    }

    std::vector<unsigned char> items(static_cast<std::size_t>(size));
    stream->input->read(reinterpret_cast<char*>(items.data()), static_cast<std::streamsize>(items.size()));
    items.resize(static_cast<std::size_t>(stream->input->gcount()));

    auto bytes = std::make_shared<bytes_value>();
    bytes->items = std::move(items);
    return bytes;
  });
}

value stream_write_chunk_async(const value& input, const value& bytesValue) {
  return stream_async_result([input, bytesValue]() -> value {
    const auto stream = require_stream_value(input);
    require_stream_open(stream);
    if (stream->mode != stream_mode::write || !stream->output) {
      throw_wrong_direction("stream", "writeChunk", "write");
    }

    const auto bytes = require_stream_bytes(bytesValue);
    stream->output->write(reinterpret_cast<const char*>(bytes->items.data()), static_cast<std::streamsize>(bytes->items.size()));
    if (!*stream->output) {
      throw std::runtime_error("Unable to write stream chunk");
    }
    return value(std::monostate{});
  });
}

value stream_close_async(const value& input) {
  return stream_async_result([input]() -> value {
    const auto stream = require_stream_value(input);
    if (stream->closed) {
      throw_closed_handle("stream", "stream");
    }

    if (stream->input) {
      stream->input->close();
    }
    if (stream->output) {
      stream->output->close();
    }
    stream->closed = true;
    return value(std::monostate{});
  });
}`;
}
