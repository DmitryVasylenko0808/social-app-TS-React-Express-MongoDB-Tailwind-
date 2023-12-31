const PostModel = require("../models/Post");
const CommentModel = require("../models/Comment");

class CommentsController {
    static async getAllByPostId(req, res) {
        try {
            const comments = await CommentModel.find({ post: req.params.postId })
                .populate("user", "login name avatar_file");

            res.json(comments);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    static async add(req, res) {
        try {
            const post = await PostModel.findById(req.body.postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post is not found" });
            }

            const doc = new CommentModel({
                user: req.userId,
                post: req.body.postId,
                text: req.body.text
            });
            await doc.save();

            await PostModel.findByIdAndUpdate(
                req.body.postId, 
                { 
                    $inc: { comments_count: 1 } 
                }
            );

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    static async remove(req, res) {
        try {
            const post = await PostModel.findById(req.params.postId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post is not found" });
            }

            const comment = await CommentModel.findById(req.params.commentId);
            if (!comment) {
                return res.status(404).json({ success: false, message: "Cannot delete the comment" });
            }

            await CommentModel.deleteOne({ _id: req.params.commentId});

            await PostModel.findByIdAndUpdate(
                req.body.postId, 
                { 
                    $inc: { comments_count: -1 } 
                }
            );

            res.json(true);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
}

module.exports = CommentsController;