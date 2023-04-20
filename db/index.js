const { Client } = require('pg');

const client = new Client('postgres:localhost:5432/juicebox-dev');

const getAllUsers = async() => {
  try {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active
        FROM users;
        `);
        console.log(rows);
        return rows;
  } catch (err) {
    throw err
  }
}

const getPostByUser = async(userId) => {
    try {
        const { rows } = await client.query(`
          SELECT * FROM posts
          WHERE "authorId"=$1;
        `, [userId]);
        console.log('jdshfaskjhfa', rows)
        return rows;
      } catch (error) {
        throw error;
      }
};

const getUserById = async(userId) => {
    try {
        const { rows: [user] } = await client.query(`
        SELECT id FROM users
        WHERE id=$1
        `, [userId])
        if (!user) {
          return null
        }
        user.post = await getPostsByUser(userId);

        console.log(user);
        return user
    } catch (error) {
        throw error
    }
}

const createUser = async({ username, password, name, location }) => {
    try {
        const {rows} = await client.query(`
        INSERT INTO users (username, password, name, location) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `, [ username, password, name, location ])
        return rows;
    } catch (err) {
        throw err;
    }
};

const getAllTags = async() =>{
  try {
    const { rows } = await client.query(`
      SELECT * 
      FROM tags;
    `);

    return { rows }
  } catch (error) {
    throw error;
  }
}

const addTagsToPost = async(postId, tagList) =>{
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

const updateUser = async(id, fields = {}) => {
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
        
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [user] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields), user);
      console.log(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const createPost = async({
    authorId,
    title,
    content,
    tags = []
  }) => {
    try {
      const { row: [posts] } = await client.query(`
      INSERT INTO posts("authorId", title, content)
      VALUES($1, $2, $3)
      RETURNING *;
      `, [authorId, title, content])

      const tagLists = await createTags(tags)

      return await addTagsToPost(post.id, tagLists)
    } catch (error) {
      throw error;
    }
  };

  const getPostById = async(postId) =>{
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  }

  const updatePost = async(id, fileds = {}) => {

    const { tags } = fields;

    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
        
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [post] } = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields), post);

      if (tags === undefined) {
        return await getPostById(postId);
      }

      const tagList = await createTags(tags);
      const tagListIdString = tagList.map(
        tag => `${ tag.id }`
      ).join(', ');

      await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId]);

    await addTagsToPost(postId, tagList);

      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  };

  const getAllPosts = async() => {
     try {
        const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts;
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (error) {
    throw error;
  }
}

  const getPostsByUser = async(userId) => {
    try {
      const { rows: [postIds] } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${userId};
      `);

      const posts = await Promise.all(postIds.map(
        post => getPostById(post.id)
      ))
      return posts;
    } catch (error) {
      throw error;
    }
  };

  const getPostsByTagName = async(tagName) =>{
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      return await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
    } catch (error) {
      throw error;
    }
  }

 const createTags = async(tagLists) => {
  if (tagList.length === 0) {
    return [ ];
  }

  const valuesStringInsert = tagList.map(
    (_, index) => `$${index + 1}`
  ).join('), (');

  const valuesStringSelect = tagList.map(
    (_, index) => `$${index + 1}`
  ).join(', ');

  try {
    await client.query(`
      INSERT INTO tags(name)
      VALUES (${ valuesStringInsert })
      ON CONFLICT (name) DO NOTHING;
    `, tagList);

    const { rows } = await client.query(`
      SELECT * FROM tags
      WHERE name
      IN (${ valuesStringSelect });
    `, tagList);

    return rows;
  } catch (error) {
    throw error;
  }
};
 

 const createPostTags = async(title, content, tags) => {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    throw error;
  }
 }

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    getPostByUser,
    createPost,
    getUserById,
    getAllPosts,
    getPostsByUser,
    updatePost,
    getAllTags,
    getPostsByUser,
    getPostsByTagName,
    createPostTags
}