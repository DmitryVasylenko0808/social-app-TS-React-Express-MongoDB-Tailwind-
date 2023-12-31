const UserModel = require("../models/User");
const PostModel = require("../models/Post");
const moveFile = require("../utils/moveFile");

class PostsController {
    static async getAll(req, res) {
        try {
            let posts = await PostModel.find()
                .sort({ createdAt: -1 })
                .limit(req.params.limit)
                .populate("user", "login name avatar_file black_list");

            posts = posts.sort((a, b) => b.likes_list.length - a.likes_list.length);

            res.json(posts);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getOneById(req, res) {
        try {
            const post = await PostModel.findOne(
                { 
                    user: req.params.userId, 
                    _id: req.params.postId 
                }).populate("user", "name login avatar_file");
            
            if (!post) {
                return res.status(404).json({ success: false, message: "Post is not found" });
            }
            
            res.json(post);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getAllByUserId(req, res) {
        try {
            const posts = await PostModel.find(
                { user: req.params.userId } 
            ).populate("user", "login name avatar_file");
            
            res.json(posts);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async getSaved(req, res) {
        try {
            const user = await UserModel.findById(req.userId)
                .populate({
                    path: "saved_posts.post",
                    populate: {
                        path: "user",
                        select: "login name avatar_file"
                    }
                });
            if (!user) {
                return res.status(404).json({ success: false, message: "User is not found" });
            }

            let { saved_posts } = user;
            saved_posts = saved_posts.map(p => p.post);
            if (saved_posts.length === 0) {
                return res.status(404).json({ success: false, message: "Posts are not found" });
            }

            res.json(saved_posts);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async create(req, res) {
        try {
            let UPostFileName = null;
            if (req.files && req.files.image) {
                UPostFileName = await moveFile(req.files.image, "../server/public/posts");
            }

            const doc = new PostModel({
                user: req.userId,
                text: req.body.text,
                image: UPostFileName,
                likes_list: [],
                saves_list: []
            });
            await doc.save();

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async edit(req, res) {
        try {
            let UPostFileName = null;
            if (req.files && req.files.image_file) {
                UPostFileName = await moveFile(req.files.image_file, "../server/public/posts");
            }

            let post;
            if (req.files && req.files.image_file) {
                post = await PostModel.findByIdAndUpdate(
                    { _id: req.params.postId },
                    {
                        text: req.body.text,
                        image: UPostFileName
                    }
                );
            } else {
                post = await PostModel.findByIdAndUpdate(
                    { _id: req.params.postId },
                    {
                        text: req.body.text
                    }
                );
            }

            if (!post) {
                return res.status(404).json({ success: false, message: "Post is not found" });
            }

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async like(req, res) {
        try {
            const post = await PostModel.findOne(
                {   _id: req.params.postId,
                    likes_list: {
                        $elemMatch: { user: req.userId }
                    }
                }
            );

            if (post) {
                return res.status(400).json({ success: false, message: "This post is already liked" });
            }

            await PostModel.updateOne(
                { _id: req.params.postId },
                { 
                    $push: {
                        likes_list: {
                            user: req.userId
                        }
                    }      
                }
            );

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async save(req, res) {
        try {
            const post = await PostModel.findOne(
                {   _id: req.params.postId,
                    saves_list: {
                        $elemMatch: { user: req.userId }
                    }
                }
            );

            if (post) {
                return res.status(400).json({ success: false, message: "This post is already saved" });
            }

            await PostModel.updateOne(
                { _id: req.params.postId },
                { 
                    $push: {
                        saves_list: {
                            user: req.userId
                        }
                    }      
                }
            );
            await UserModel.updateOne(
                { _id: req.userId },
                { 
                    $push: {
                        saved_posts: {
                            post: req.params.postId
                        }
                    }      
                }
            )

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    static async remove(req, res) {
        try {
            const post = await PostModel.findByIdAndDelete(req.params.postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post is not found" });
            }

            await UserModel.updateMany(
                { 
                    saved_posts: {
                        $elemMatch: { post: req.params.postId }
                    }
                },
                { 
                    $pull: {
                        saved_posts: {
                            post: req.params.postId
                        }
                    }      
                }
            );

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Server error" });
        }
    }
}

module.exports = PostsController;